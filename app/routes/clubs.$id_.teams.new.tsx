import { requireUserId } from '~/utils/auth.server.ts'

import { json } from '@remix-run/router'
import { DataFunctionArgs } from '@remix-run/server-runtime'
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
	return json(
		{ seasons, id: params.id },
		{ headers: { 'Server-Timing': timings.toString() } },
	)
}

export default function NewTeamRoute() {
	const data = useLoaderData<typeof loader>() as {
		id: string
		seasons: { id: string; name: string }[]
	}
	return <TeamEditor clubId={data.id} seasons={data.seasons} />
}
