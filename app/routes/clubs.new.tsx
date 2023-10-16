import { requireUserId } from '~/utils/auth.server.ts'

import { json } from '@remix-run/router'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { ClubEditor } from './resources+/club-editor.tsx'
import { makeTimings, time } from '~/utils/timing.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { useLoaderData } from '@remix-run/react'
import type { Sport } from '@prisma/client'

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)
	const timings = makeTimings('new club loader')
	await requireUserId(request)

	const sports = await time(() => prisma.sport.findMany(), {
		timings,
		type: 'find sports',
	})
	return json({ sports })
}

export default function NewClubRoute() {
	const data = useLoaderData<typeof loader>() as {
		sports: Sport[]
	}
	return <ClubEditor {...data} />
}
