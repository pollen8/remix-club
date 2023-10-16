import { requireUserId } from '~/utils/auth.server.ts'
import type { Member, Season, Team } from '@prisma/client'
import { json } from '@remix-run/router'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { TeamEditor } from './resources+/team-editor.tsx'
import { useLoaderData } from '@remix-run/react'
import { makeTimings, time } from '~/utils/timing.server.ts'
import { prisma } from '~/utils/db.server.ts'

export async function loader({ request, params }: DataFunctionArgs) {
	const timings = makeTimings('new team loader')
	await requireUserId(request)
	const seasons = await time(
		() =>
			prisma.season.findMany({
				where: {
					clubId: params.id,
				},
			}),
		{ timings, type: 'find club seasons' },
	)
	const team = await time(
		() =>
			prisma.team.findFirst({
				select: {
					id: true,
					name: true,
					clubId: true,
					teamType: true,
					seasonId: true,
					members: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
						},
					},
				},
				where: {
					id: params.teamId,
				},
			}),
		{ timings, type: 'load team' },
	)
	const members = await time(
		() =>
			prisma.member.findMany({
				where: {
					clubs: {
						some: {
							id: params.id,
						},
					},
				},
			}),
		{ timings, type: 'find club members' },
	)

	return json(
		{ seasons, id: params.id, team, members },
		{ headers: { 'Server-Timing': timings.toString() } },
	)
}

export default function NewTeamRoute() {
	const data = useLoaderData<typeof loader>() as {
		id: string
		seasons: Season[]
		team: Team & { members: Member[] }
		members: Member[]
	}
	return (
		<TeamEditor
			clubId={data.id}
			members={data.members}
			team={data.team}
			seasons={data.seasons}
		/>
	)
}
