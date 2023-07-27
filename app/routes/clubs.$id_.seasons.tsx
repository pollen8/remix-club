import { DataFunctionArgs, HeadersFunction, json } from '@remix-run/node'
import { NavLink, Outlet, useLoaderData } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import {
	combineServerTimings,
	makeTimings,
	time,
} from '~/utils/timing.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { z } from 'zod'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { requireUserId } from '~/utils/auth.server.ts'
import { parse } from '@conform-to/zod'
import { DeleteButton } from '~/components/ui/deleteButton.tsx'

export async function loader({ request, params }: DataFunctionArgs) {
	const timings = makeTimings('club seasons loader')

	const seasons = await time(
		() =>
			prisma.season.findMany({
				where: {
					clubId: params.id,
				},
			}),
		{ timings, type: 'find club seasons' },
	)
	return json(
		{ seasons, clubId: params.id },
		{ headers: { 'Server-Timing': timings.toString() } },
	)
}

export const headers: HeadersFunction = ({ loaderHeaders, parentHeaders }) => {
	return {
		'Server-Timing': combineServerTimings(parentHeaders, loaderHeaders),
	}
}

export default function ClubsSeasonsIndexRoute() {
	const data = useLoaderData<typeof loader>()
	return (
		<div className="container pt-12">
			<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
				<h1 className="text-h1">Seasons</h1>
				<NavLink to="new">
					<Icon name="plus">New Season</Icon>
				</NavLink>
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Id</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{data.seasons.map(season => (
							<tr key={season.id}>
								<td>{season.name}</td>
								<td>{season.id}</td>
								<td>
									<DeleteButton
										schema={DeleteFormSchema}
										intent="delete-season"
										action={action}
										id={season.id}
										clubId={data.clubId ?? ''}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<Outlet />
			</div>
		</div>
	)
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-season'),
	id: z.string(),
	clubId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const submission = parse(formData, {
		schema: DeleteFormSchema,
		acceptMultipleErrors: () => true,
	})

	if (!submission.value || submission.intent !== 'submit') {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	const { clubId, id } = submission.value

	const season = await prisma.season.findFirst({
		select: { id: true },
		where: {
			id: id,
		},
	})

	if (!season) {
		submission.error.id = ['Season not found']
		return json({ status: 'error', submission } as const, {
			status: 404,
		})
	}

	await prisma.season.delete({
		where: { id: season.id },
	})

	return redirectWithToast(`/clubs/${clubId}/seasons`, {
		title: 'Season removed',
		variant: 'destructive',
	})
}
