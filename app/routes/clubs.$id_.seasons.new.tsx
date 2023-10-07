import { requireUserId } from '~/utils/auth.server.ts'

import { json } from '@remix-run/router'
import { DataFunctionArgs } from '@remix-run/server-runtime'
import { SeasonEditor } from './resources+/season-editor.tsx'
import { useLoaderData } from '@remix-run/react'

export async function loader({ request, params }: DataFunctionArgs) {
	await requireUserId(request)
	return json({ id: params.id })
}

export default function NewSeasonRoute() {
	const data = useLoaderData<typeof loader>() as {id: string}
	return <SeasonEditor clubId={data.id} />
}
