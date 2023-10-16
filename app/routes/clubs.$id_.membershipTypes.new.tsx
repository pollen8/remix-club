import { requireUserId } from '~/utils/auth.server.ts'

import { json } from '@remix-run/router'
import { type DataFunctionArgs } from '@remix-run/server-runtime'
import { useLoaderData } from '@remix-run/react'
import { MembershipTypeEditor } from './resources+/membership-type-editor.tsx'

export async function loader({ request, params }: DataFunctionArgs) {
	await requireUserId(request)
	return json({ id: params.id })
}

export default function NewMembershipTypeRoute() {
	const data = useLoaderData<typeof loader>() as { id: string }
	return <MembershipTypeEditor clubId={data.id} />
}
