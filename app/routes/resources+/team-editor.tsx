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
import { FormActions } from '~/components/FormActions.tsx'
import { Dialog, DialogHeader } from '~/components/Dialog.tsx'
import type { Member, Season, Team } from '@prisma/client'
import { MultiCheckbox } from '~/components/mutli-checkbox.tsx'
import { SelectField } from '~/components/SelectField.tsx'
import { SubmitButton } from '~/components/SubmitButton.tsx'

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

export async function action({ request }: DataFunctionArgs) {
	await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: TeamEditorSchema,
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

	const { name, id, clubId, seasonId, teamType, members } = submission.value
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
		members: {
			connect: members.map(member => {
				return {
					id: member,
				}
			}),
		},
	}

	const select = {
		id: true,
	}
	if (id) {
		const existingTeam = await prisma.team.findFirst({
			where: { id },
			select: { id: true, members: { select: { id: true } } },
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
		data.members = {
			...data.members,
			disconnect: existingTeam.members,
		} as any
		await prisma.team.update({
			where: { id },
			data,
			select,
		})
	} else {
		await prisma.team.create({ data, select })
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
	team?: Team & { members: Member[] }
	members: Member[]
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
			...team,
			members: team?.members.map(m => m.id),
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

					<SelectField
						options={seasons}
						placeHolder="Season"
						field={fields.seasonId}
					/>

					<Field
						labelProps={{ children: 'Name' }}
						inputProps={{
							...conform.input(fields.name),
							autoFocus: true,
						}}
						errors={fields.name.errors}
						className="flex flex-col gap-y-2"
					/>
					<SelectField
						options={teamTypes}
						placeHolder="Team type"
						field={fields.teamType}
					/>

					<MultiCheckbox
						field={fields.members}
						label="Players"
						items={members.map(m => ({
							id: m.id,
							label: m.firstName + ' ' + m.lastName,
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
						<SubmitButton fetcher={teamEditorFetcher} />
					</FormActions>
				</teamEditorFetcher.Form>
			</Dialog>
		</>
	)
}
