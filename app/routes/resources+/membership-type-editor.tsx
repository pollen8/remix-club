import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useNavigate } from '@remix-run/react'
import { z } from 'zod'
import { Button } from '~/components/ui/button.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { ErrorList, Field } from '~/components/forms.tsx'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { Dialog, DialogHeader } from '~/components/Dialog.tsx'
import { FormActions } from '~/components/FormActions.tsx'
import type { ClubMembershipTypes } from '@prisma/client'
import { formatDate } from '~/utils/date.ts'

export const MembershipTypeEditorSchema = z.object({
	id: z.string().optional(),
	clubId: z.string(),
	title: z.string().min(1),
	cost: z.number(),
})

export async function action({ request }: DataFunctionArgs) {
	await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: MembershipTypeEditorSchema,
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

	const { title, cost, id, clubId } = submission.value

	const data = {
		title,
		cost,
		clubId: clubId,
	}

	const select = {
		id: true,
	}
	if (id) {
		const existingMembership = await prisma.clubMembershipTypes.findFirst({
			where: { id },
			select: { id: true },
		})
		if (!existingMembership) {
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 404 },
			)
		}
		await prisma.clubMembershipTypes.update({
			where: { id },
			data,
			select,
		})
	} else {
		await prisma.clubMembershipTypes.create({ data, select })
	}
	return redirectWithToast(`/clubs/${clubId}/membershipTypes`, {
		title: id ? 'Membership type updated' : 'Membership type created',
	})
}

export function MembershipTypeEditor({
	clubId,
	membershipType,
}: {
	clubId: string
	membershipType?: ClubMembershipTypes
}) {
	const navigate = useNavigate()
	const membershipTypeEditorFetcher = useFetcher<typeof action>()
	const [form, fields] = useForm({
		id: 'season-editor',
		constraint: getFieldsetConstraint(MembershipTypeEditorSchema),
		lastSubmission: membershipTypeEditorFetcher.data?.submission,
		onValidate({ formData }) {
			console.log(
				'validate',
				parse(formData, { schema: MembershipTypeEditorSchema }),
			)
			return parse(formData, { schema: MembershipTypeEditorSchema })
		},
		defaultValue: membershipType,
		shouldRevalidate: 'onBlur',
	})

	return (
		<Dialog>
			<DialogHeader>
				{membershipType?.id ? 'Edit membership type' : 'Add membership type'}
			</DialogHeader>

			<membershipTypeEditorFetcher.Form
				method="post"
				action="/resources/membership-type-editor"
				{...form.props}
			>
				<input name="clubId" type="hidden" value={clubId} />
				<input name="id" type="hidden" value={membershipType?.id} />
				<Field
					labelProps={{ children: 'Name' }}
					inputProps={{
						...conform.input(fields.title),
						autoFocus: true,
					}}
					errors={fields.title.errors}
					className="flex flex-col gap-y-2"
				/>
				<Field
					labelProps={{ children: 'Cost' }}
					inputProps={{
						type: 'number',
						...conform.input(fields.cost),
						defaultValue: formatDate(fields.cost),
					}}
					errors={fields.cost.errors}
					className="flex flex-col gap-y-2"
				/>

				<ErrorList errors={form.errors} id={form.errorId} />
				<FormActions>
					<Button variant="outline" type="button" onClick={() => navigate(-1)}>
						Cancel
					</Button>
					<StatusButton
						status={
							membershipTypeEditorFetcher.state === 'submitting'
								? 'pending'
								: membershipTypeEditorFetcher.data?.status ?? 'idle'
						}
						type="submit"
						disabled={membershipTypeEditorFetcher.state !== 'idle'}
						className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
					>
						<Icon
							name="arrow-right"
							className="scale-125 max-md:scale-150 md:mr-2"
						/>
						<span className="max-md:hidden">Submit</span>
					</StatusButton>
				</FormActions>
			</membershipTypeEditorFetcher.Form>
		</Dialog>
	)
}
