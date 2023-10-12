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
import { FormActions } from '~/components/FormActions.tsx'
import { Dialog, DialogHeader } from '~/components/Dialog.tsx'

export const MemberEditorSchema = z.object({
	id: z.string().optional(),
	clubId: z.string(),
	name: z.string().min(1),
	email: z.string().email(),
	mobile: z.string().optional(),
})

export async function action({ request, params }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: MemberEditorSchema,
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
	let member

	const { name, email, mobile, id, clubId } = submission.value

	const data = {
		name,
		email: email,
		mobile: mobile ?? '',
		clubs: {
			connect: {
				id: clubId,
			},
		},
	}

	const select = {
		id: true,
	}
	if (id) {
		const existingMember = await prisma.member.findFirst({
			where: { id },
			select: { id: true },
		})
		if (!existingMember) {
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 404 },
			)
		}
		member = await prisma.member.update({
			where: { id },
			data,
			select,
		})
	} else {
		member = await prisma.member.create({ data, select })
	}
	return redirectWithToast(`/clubs/${clubId}/members`, {
		title: id ? 'Member updated' : 'Member created',
	})
}

export function MemberEditor({
	clubId,
	member,
}: {
	clubId: string
	member?: { id: string; name: string; email: string; mobile: string }
}) {
	const navigate = useNavigate()
	const memberEditorFetcher = useFetcher<typeof action>()
	const [form, fields] = useForm({
		id: 'member-editor',
		constraint: getFieldsetConstraint(MemberEditorSchema),
		lastSubmission: memberEditorFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: MemberEditorSchema })
		},
		defaultValue: {
			name: member?.name,
			email: member?.email,
			mobile: member?.mobile,
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<>
			{/* <Dialog> */}
			{/* <DialogHeader>Add/Edit member</DialogHeader> */}
			<memberEditorFetcher.Form
				method="post"
				action="/resources/member-editor"
				{...form.props}
			>
				<input name="clubId" type="hidden" value={clubId} />
				<input name="id" type="hidden" value={member?.id} />
				<Field
					labelProps={{ children: 'Name' }}
					inputProps={{
						...conform.input(fields.name),
						autoFocus: true,
					}}
					errors={fields.name.errors}
					className="flex flex-col gap-y-2"
				/>
				<Field
					labelProps={{ children: 'Email' }}
					inputProps={{
						...conform.input(fields.email),
					}}
					errors={fields.name.errors}
					className="flex flex-col gap-y-2"
				/>
				<Field
					labelProps={{ children: 'Mobile' }}
					inputProps={{
						...conform.input(fields.mobile),
					}}
					errors={fields.name.errors}
					className="flex flex-col gap-y-2"
				/>
				<ErrorList errors={form.errors} id={form.errorId} />
				<FormActions>
					<Button variant="outline" type="button" onClick={() => navigate(-1)}>
						Cancel
					</Button>
					<StatusButton
						status={
							memberEditorFetcher.state === 'submitting'
								? 'pending'
								: memberEditorFetcher.data?.status ?? 'idle'
						}
						type="submit"
						disabled={memberEditorFetcher.state !== 'idle'}
						className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
					>
						<Icon
							name="arrow-right"
							className="scale-125 max-md:scale-150 md:mr-2"
						/>
						<span className="max-md:hidden">Submit</span>
					</StatusButton>
				</FormActions>
			</memberEditorFetcher.Form>
			{/* </Dialog> */}
		</>
	)
}
