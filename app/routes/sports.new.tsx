import { requireUserId } from '~/utils/auth.server.ts'

import { json } from '@remix-run/router'
import type { DataFunctionArgs } from '@remix-run/server-runtime'
import { SportEditor } from './resources+/sports-editor.tsx'

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)

	return json({})
}

export default function NewSportsRoute() {
	return <SportEditor />
}
