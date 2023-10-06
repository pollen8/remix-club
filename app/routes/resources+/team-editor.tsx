import { conform, useFieldList, useForm } from '@conform-to/react'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select.tsx'
import { FormGroup } from '~/components/FormGroup.tsx'
import { useState } from 'react'
import { Member, Season, Team } from '@prisma/client'
import { MultiCheckbox } from '~/components/mutli-checkbox.tsx'

const teamTypes = [
	'open6',
	'ladies6',
	'mens6',
	'mixed6',
	'open4',
	'ladies4',
	'mens4',
	'mixed4',
]

const teamValues: [string, ...string[]] = [teamTypes[0], ...teamTypes]
export const TeamEditorSchema = z.object({
	id: z.string().optional(),
	clubId: z.string(),
	seasonId: z.string(),
	teamType: z.enum(teamValues),
	members: z.array(z.string()),
	name: z.string().min(1),
})

export async function action({ request, params }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	console.log('submit', formData)
	const submission = parse(formData, {
		schema: TeamEditorSchema,
		acceptMultipleErrors: () => true,
	})
	console.log('submission', submission)
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

	const { name, id, clubId, seasonId, teamType } = submission.value

	// @TODO connect to search
	const data = {
		name,
		teamType,
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
		console.log('update', data, select)
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
	members,
}: {
	clubId: string
	seasons: Season[]
	team?: Team
	members: Member[]
}) {
	console.log('team', team)
	const navigate = useNavigate()
	const teamEditorFetcher = useFetcher<typeof action>()
	const [form, fields] = useForm({
		id: 'team-editor',
		constraint: getFieldsetConstraint(TeamEditorSchema),
		lastSubmission: teamEditorFetcher.data?.submission,
		onValidate({ formData }) {
			console.log('validate', parse(formData, { schema: TeamEditorSchema }))
			return parse(formData, { schema: TeamEditorSchema })
		},
		defaultValue: {
			...team,
		},
		shouldRevalidate: 'onBlur',
	})

	const list = useFieldList(form.ref, fields.members)
	const [players, setPlayers] = useState([])
	console.log('errors', form.errors)
	// console.log(teamEditorFetcher)
	console.log(conform.input(fields.teamType))
	console.log(fields.members)
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

					<FormGroup>
						<Select {...conform.input(fields.seasonId)}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Season" />
							</SelectTrigger>
							<SelectContent>
								{seasons.map(season => (
									<SelectItem key={season.id} value={season.id}>
										{season.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormGroup>
					<Field
						labelProps={{ children: 'Name' }}
						inputProps={{
							...conform.input(fields.name),
							autoFocus: true,
						}}
						errors={fields.name.errors}
						className="flex flex-col gap-y-2"
					/>
					<FormGroup>
						<Select {...conform.input(fields.teamType)}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Team type" />
							</SelectTrigger>
							<SelectContent>
								{teamTypes.map(teamType => (
									<SelectItem key={teamType} value={teamType}>
										{teamType}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormGroup>

					<MultiCheckbox
						field={fields.members}
						label="Players"
						items={members.map(m => ({
							id: m.id,
							label: m.name,
							value: m.id,
						}))}
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
