import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useNavigate } from '@remix-run/react'
import { z } from 'zod'
import { Button } from '~/components/ui/button.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { ErrorList, Field, TextareaField } from '~/components/forms.tsx'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { Dialog } from '~/components/Dialog.tsx'
import { FormActions } from '~/components/FormActions.tsx'
import { SubmitButton } from '~/components/SubmitButton.tsx'
import { Club, Sport } from '@prisma/client'
import { SelectField } from '~/components/SelectField.tsx'

export const ClubEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1),
	description: z.string().optional(),
	sportId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: ClubEditorSchema,
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
	let club: { id: string }

	const { name, description, id, sportId } = submission.value

	const data = {
		createdById: userId,
		name,
		description: description ?? '',
		sportId,
	}

	const select = {
		id: true,
	}
	if (id) {
		const existingClub = await prisma.club.findFirst({
			where: { id, createdById: userId },
			select: { id: true },
		})
		if (!existingClub) {
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 404 },
			)
		}
		club = await prisma.club.update({
			where: { id },
			data,
			select,
		})
	} else {
		club = await prisma.club.create({ data, select })
	}
	return redirectWithToast(`/clubs`, {
		title: id ? 'Club updated' : 'Club created',
	})
}

export function ClubEditor({ club, sports }: { sports: Sport[]; club?: Club }) {
	const navigate = useNavigate()
	const clubEditorFetcher = useFetcher<typeof action>()

	const [form, fields] = useForm({
		id: 'club-editor',
		constraint: getFieldsetConstraint(ClubEditorSchema),
		lastSubmission: clubEditorFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ClubEditorSchema })
		},
		defaultValue: {
			name: club?.name,
			description: club?.description,
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<Dialog>
			<clubEditorFetcher.Form
				method="post"
				action="/resources/club-editor"
				className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
				{...form.props}
			>
				<input name="id" type="hidden" value={club?.id} />
				Edit club....
				<Field
					labelProps={{ children: 'Name' }}
					inputProps={{
						...conform.input(fields.name),
						autoFocus: true,
					}}
					errors={fields.name.errors}
					className="flex flex-col gap-y-2"
				/>
				<TextareaField
					labelProps={{ children: 'Description' }}
					textareaProps={{
						...conform.textarea(fields.description),
						className: 'flex-1 resize-none',
					}}
					errors={fields.description.errors}
					className="flex flex-1 flex-col gap-y-2"
				/>
				<SelectField
					options={sports.map(sport => ({ id: sport.id, name: sport.name }))}
					placeHolder="Sport"
					field={fields.sportId}
				/>
				<ErrorList errors={form.errors} id={form.errorId} />
				<FormActions>
					<Button variant="outline" type="button" onClick={() => navigate(-1)}>
						Cancel
					</Button>
					<SubmitButton fetcher={clubEditorFetcher} />
				</FormActions>
			</clubEditorFetcher.Form>
		</Dialog>
	)
}
