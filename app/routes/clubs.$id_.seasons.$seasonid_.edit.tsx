import { requireUserId } from '~/utils/auth.server.ts'
import type { Member, Season } from '@prisma/client'
import { json } from '@remix-run/router'
import { DataFunctionArgs } from '@remix-run/server-runtime'
import { useLoaderData } from '@remix-run/react'
import { makeTimings, time } from '~/utils/timing.server.ts'
import { prisma } from '~/utils/db.server.ts'
import {SeasonEditor} from './resources+/season-editor.tsx'

export async function loader({ request, params }: DataFunctionArgs) {
	const timings = makeTimings('edit season loader')
	await requireUserId(request)

	const season = await time(
		() =>
			prisma.season.findFirst({
				where: {
					id: params.seasonId,
				},
			}),
		{ timings, type: 'edit season season' },
	)


	return json(
		{ season, id: params.id },
		{ headers: { 'Server-Timing': timings.toString() } },
	)
}

export default function EditSeasonRoute() {
	const data = useLoaderData<typeof loader>() as {
		id: string
		season: Season
	}
	return (
		<SeasonEditor
			clubId={data.id}
			season={data.season}
		/>
	)
}
