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

export const TeamEditorSchema = z.object({
	id: z.string().optional(),
	clubId: z.string(),
	seasonId: z.string(),
	name: z.string().min(1),
})

export async function action({ request, params }: DataFunctionArgs) {
	console.log('submit')
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: TeamEditorSchema,
		acceptMultipleErrors: () => true,
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
	let team

	const { name, id, clubId, seasonId } = submission.value

	// @TODO connect to search
	const data = {
		name,
		club: {
			connect: {
				id: clubId,
			},
		},
		season: {
			connect: {
				id: seasonId,
			},
		},
	}

	const select = {
		id: true,
	}
	if (id) {
		const existingTeam = await prisma.team.findFirst({
			where: { id },
			select: { id: true },
		})
		if (!existingTeam) {
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 404 },
			)
		}
		team = await prisma.team.update({
			where: { id },
			data,
			select,
		})
	} else {
		team = await prisma.team.create({ data, select })
	}
	return redirectWithToast(`/clubs/${clubId}/teams`, {
		title: id ? 'Team updated' : 'Team created',
	})
}

export function TeamEditor({
	clubId,
	team,
	seasons,
}: {
	clubId: string
	seasons: any[]
	team?: { id: string; name: string }
}) {
	const navigate = useNavigate()
	const teamEditorFetcher = useFetcher<typeof action>()
	const [form, fields] = useForm({
		id: 'team-editor',
		constraint: getFieldsetConstraint(TeamEditorSchema),
		lastSubmission: teamEditorFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: TeamEditorSchema })
		},
		defaultValue: {
			name: team?.name,
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<>
			<Dialog>
				<DialogHeader>{team?.id ? 'Edit' : 'Add'} team</DialogHeader>
				<teamEditorFetcher.Form
					method="post"
					action="/resources/team-editor"
					{...form.props}
				>
					<input name="clubId" type="hidden" value={clubId} />
					<input name="id" type="hidden" value={team?.id} />
					<label htmlFor="season">Season</label>
					<select {...conform.input(fields.seasonId)}>
						{seasons.map(season => (
							<option key={season.id} value={season.id}>
								{season.name}
							</option>
						))}
					</select>
					<Field
						labelProps={{ children: 'Name' }}
						inputProps={{
							...conform.input(fields.name),
							autoFocus: true,
						}}
						errors={fields.name.errors}
						className="flex flex-col gap-y-2"
					/>

					<ErrorList errors={form.errors} id={form.errorId} />
					<FormActions>
						<Button
							variant="outline"
							type="button"
							onClick={() => navigate(-1)}
						>
							Cancel
						</Button>
						<StatusButton
							status={
								teamEditorFetcher.state === 'submitting'
									? 'pending'
									: teamEditorFetcher.data?.status ?? 'idle'
							}
							type="submit"
							disabled={teamEditorFetcher.state !== 'idle'}
							className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
						>
							<Icon
								name="arrow-right"
								className="scale-125 max-md:scale-150 md:mr-2"
							/>
							<span className="max-md:hidden">Submit</span>
						</StatusButton>
					</FormActions>
				</teamEditorFetcher.Form>
			</Dialog>
		</>
	)
}
