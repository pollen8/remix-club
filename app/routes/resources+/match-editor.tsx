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
import type { Match, Team } from '@prisma/client'
import { formatDate } from '~/utils/date.ts'

export const MatchEditorSchema = z.object({
	id: z.string().optional(),
	clubId: z.string(),
	teamId: z.string(),
	oppositionTeamId: z.string(),
	startDateTime: z.string().pipe(z.coerce.date()),
})

export async function action({ request }: DataFunctionArgs) {
	await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: MatchEditorSchema,
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
	const { oppositionTeamId, teamId, startDateTime, id, clubId } =
		submission.value

	const data = {
		clubId,
		oppositionTeamId,
		teamId,
		start: startDateTime ?? new Date(),
	}

	const select = {
		id: true,
	}
	if (id) {
		const existingMatch = await prisma.match.findFirst({
			where: { id },
			select: { id: true },
		})
		if (!existingMatch) {
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 404 },
			)
		}
		await prisma.match.update({
			where: { id },
			data,
			select,
		})
	} else {
		await prisma.match.create({ data, select })
	}
	return redirectWithToast(`/clubs/${clubId}/matches`, {
		title: id ? 'Match updated' : 'Match created',
	})
}

export function MatchEditor({
	clubId,
	match,
	teams,
}: {
	clubId: string
	match?: Match
	teams: Team[]
}) {
	const navigate = useNavigate()
	const matchEditorFetcher = useFetcher<typeof action>()
	const [form, fields] = useForm({
		id: 'match-editor',
		constraint: getFieldsetConstraint(MatchEditorSchema),
		lastSubmission: matchEditorFetcher.data?.submission,
		onValidate({ formData }) {
			console.log('validate', parse(formData, { schema: MatchEditorSchema }))
			return parse(formData, { schema: MatchEditorSchema })
		},
		defaultValue: {},
		shouldRevalidate: 'onBlur',
	})

	return (
		<Dialog>
			<DialogHeader>{match?.id ? 'Edit match' : 'Add match'}</DialogHeader>

			<matchEditorFetcher.Form
				method="post"
				action="/resources/match-editor"
				{...form.props}
			>
				<input name="clubId" type="hidden" value={clubId} />
				<input name="id" type="hidden" value={match?.id} />

				<Field
					labelProps={{ children: 'Match date' }}
					inputProps={{
						type: 'date',
						...conform.input(fields.startDateTime),
						defaultValue: formatDate(fields.startDateTime),
					}}
					errors={fields.startDateTime.errors}
					className="flex flex-col gap-y-2"
				/>
				<ErrorList errors={form.errors} id={form.errorId} />
				<FormActions>
					<Button variant="outline" type="button" onClick={() => navigate(-1)}>
						Cancel
					</Button>
					<StatusButton
						status={
							matchEditorFetcher.state === 'submitting'
								? 'pending'
								: matchEditorFetcher.data?.status ?? 'idle'
						}
						type="submit"
						disabled={matchEditorFetcher.state !== 'idle'}
						className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
					>
						<Icon
							name="arrow-right"
							className="scale-125 max-md:scale-150 md:mr-2"
						/>
						<span className="max-md:hidden">Submit</span>
					</StatusButton>
				</FormActions>
			</matchEditorFetcher.Form>
		</Dialog>
	)
}
