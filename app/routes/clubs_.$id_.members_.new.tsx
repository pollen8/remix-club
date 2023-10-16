import { json, type DataFunctionArgs } from '@remix-run/node'

import { MemberEditor } from './resources+/member-editor.tsx'
import { useLoaderData } from '@remix-run/react'

export async function loader({ request, params }: DataFunctionArgs) {
	return json({ id: params.id })
}

export default function NewMemberRoute() {
	const data = useLoaderData<typeof loader>()
	if (!data.id) {
		return <div>Unable to get club id</div>
	}
	return (
		<div className="pd-10 m-20">
			<h1 className="text-h1">Add details</h1>
			<MemberEditor clubId={data.id} />
		</div>
	)
}
