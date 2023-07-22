import { requireUserId } from '~/utils/auth.server.ts'

import { json } from '@remix-run/router'
import { DataFunctionArgs } from '@remix-run/server-runtime'
import { MemberEditor } from './resources+/member-editor.tsx'
import { useLoaderData } from '@remix-run/react'

export async function loader({ request, params }: DataFunctionArgs) {
	await requireUserId(request)
	return json({ id: params.id })
}

export default function NewMemberRoute() {
	const data = useLoaderData<typeof loader>()
	console.log('data', data)
	return <MemberEditor clubId={data.id} />
}
