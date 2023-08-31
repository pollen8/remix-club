import { DataFunctionArgs, HeadersFunction, json } from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'
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
import { TableTitle } from '~/components/TableTitle.tsx'
import { ButtonLink } from '~/components/ButtonLink.tsx'
import { Th, Table, Td } from '~/components/Table.tsx'

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
		<div className="container pt-6">
			<div>
				<TableTitle>
					<h1 className="text-h1">Seasons</h1>
					<ButtonLink to="new">
						<Icon name="plus">New Season</Icon>
					</ButtonLink>
				</TableTitle>
				<Table>
					<thead>
						<tr>
							<Th>Name</Th>
							<Th>Id</Th>
							<Th></Th>
						</tr>
					</thead>
					<tbody>
						{data.seasons.map(season => (
							<tr key={season.id}>
								<Td>{season.name}</Td>
								<Td>{season.id}</Td>
								<Td className="w-1">
									<DeleteButton
										schema={DeleteFormSchema}
										intent="delete-season"
										size="sm"
										action={action}
										id={season.id}
										clubId={data.clubId ?? ''}
									/>
								</Td>
							</tr>
						))}
					</tbody>
				</Table>
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
