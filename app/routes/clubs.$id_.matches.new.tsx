import { requireUserId } from '~/utils/auth.server.ts'

import { json } from '@remix-run/router'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { useLoaderData } from '@remix-run/react'
import { MatchEditor } from './resources+/match-editor.tsx'
import { type Team } from '@prisma/client'
import { makeTimings, time } from '~/utils/timing.server.ts'
import { prisma } from '~/utils/db.server.ts'

export async function loader({ request, params }: DataFunctionArgs) {
	const timings = makeTimings('new match loader')

	await requireUserId(request)
	const teams = await time(() => prisma.team.findMany({}), {
		timings,
		type: 'find teams',
	})
	return json({ id: params.id, teams })
}

export default function NewMatchRoute() {
	const data = useLoaderData<typeof loader>() as {
		id: string
		teams: Team[]
	}
	return <MatchEditor clubId={data.id} teams={data.teams} />
}
