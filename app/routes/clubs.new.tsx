import { requireUserId } from '~/utils/auth.server.ts'

import { json } from '@remix-run/router'
import { DataFunctionArgs } from '@remix-run/server-runtime'
import { ClubEditor } from './resources+/club-editor.tsx'

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)
	return json({})
}

export default function NewClubRoute() {
	return <ClubEditor />
}
