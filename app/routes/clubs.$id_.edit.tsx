import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { ClubEditor } from './resources+/club-editor.tsx'

export async function loader({ params, request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const club = await prisma.club.findFirst({
		where: {
			id: params.id,
			createdById: userId,
		},
	})
	if (!club) {
		throw new Response('Not found', { status: 404 })
	}
	return json({ club: club })
}

export default function ClubEdit() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="absolute inset-0">
			<ClubEditor
				club={{
					...data.club,
					createdAt: new Date(data.club.createdAt),
					updatedAt: new Date(data.club.updatedAt),
				}}
				sports={[]}
			/>
		</div>
	)
}
