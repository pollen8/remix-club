import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useNavigate } from '@remix-run/react'
import { z } from 'zod'
import { Button } from '~/components/ui/button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { ErrorList, Field } from '~/components/forms.tsx'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { Dialog } from '~/components/Dialog.tsx'
import { FormActions } from '~/components/FormActions.tsx'
import { SubmitButton } from '~/components/SubmitButton.tsx'
import type { Sport } from '@prisma/client'

export const SportsEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1),
})

export async function action({ request }: DataFunctionArgs) {
	await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: SportsEditorSchema,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	const { id } = submission.value

	const data = { ...submission.value }

	const select = {
		id: true,
	}
	if (id) {
		const existingSport = await prisma.sport.findFirst({
			where: { id },
			select: { id: true },
		})
		if (!existingSport) {
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 404 },
			)
		}
		await prisma.sport.update({
			where: { id },
			data,
			select,
		})
	} else {
		await prisma.sport.create({ data, select })
	}
	return redirectWithToast(`/sports`, {
		title: id ? 'Sport updated' : 'Sport created',
	})
}

export function SportEditor({ sport }: { sport?: Sport }) {
	const navigate = useNavigate()
	const SportEditorFetcher = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'sport-editor',
		constraint: getFieldsetConstraint(SportsEditorSchema),
		lastSubmission: SportEditorFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: SportsEditorSchema })
		},
		defaultValue: sport,
		shouldRevalidate: 'onBlur',
	})

	return (
		<Dialog>
			<SportEditorFetcher.Form
				method="post"
				action="/resources/sports-editor"
				className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
				{...form.props}
			>
				<input name="id" type="hidden" value={sport?.id} />
				Edit sport....
				<Field
					labelProps={{ children: 'Name' }}
					inputProps={{
						...conform.input(fields.name),
						autoFocus: true,
					}}
					errors={fields.name.errors}
					className="border-grey-100 flex flex-col gap-y-2"
				/>
				<ErrorList errors={form.errors} id={form.errorId} />
				<FormActions>
					<Button variant="outline" type="button" onClick={() => navigate(-1)}>
						Cancel
					</Button>
					<SubmitButton fetcher={SportEditorFetcher} />
				</FormActions>
			</SportEditorFetcher.Form>
		</Dialog>
	)
}
