import type { DataFunctionArgs, V2_MetaFunction } from '@remix-run/node'
import { requireAnonymous, requireUserId } from '~/utils/auth.server.ts'

export const meta: V2_MetaFunction = () => [{ title: 'Remix Club' }]

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireAnonymous(request)
	console.log('user id', userId)
	return null
	// if (searchTerm === '') {
	// 	return redirect('/clubs')
	// }
}
export default function Index() {
	return <div>General non logged in home page</div>
}
