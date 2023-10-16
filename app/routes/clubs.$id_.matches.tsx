import {
	type DataFunctionArgs,
	type HeadersFunction,
	json,
} from '@remix-run/node'
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
import { ButtonGroup } from '~/components/ButtonGroup.tsx'

export async function loader({ request, params }: DataFunctionArgs) {
	const timings = makeTimings('club matches loader')

	const matches = await time(
		() =>
			prisma.match.findMany({
				where: {
					clubId: params.id,
				},
			}),
		{ timings, type: 'find club matches' },
	)
	return json(
		{ matches, clubId: params.id },
		{ headers: { 'Server-Timing': timings.toString() } },
	)
}

export const headers: HeadersFunction = ({ loaderHeaders, parentHeaders }) => {
	return {
		'Server-Timing': combineServerTimings(parentHeaders, loaderHeaders),
	}
}

export default function ClubsMatchesIndexRoute() {
	const data = useLoaderData<typeof loader>()
	return (
		<div>
			<TableTitle>
				<h2 className="text-h2">Matches</h2>
				<ButtonLink to="new">
					<Icon name="plus">New Match</Icon>
				</ButtonLink>
			</TableTitle>
			<Table>
				<thead>
					<tr>
						<Th>Team</Th>
						<Th>Opponent</Th>
						<Th />
					</tr>
				</thead>
				<tbody>
					{data.matches.map(match => (
						<tr key={match.id}>
							<Td>{match.teamId}</Td>
							<Td>{match.oppositionTeamId}</Td>
							<Td className="w-1">
								<ButtonGroup>
									<ButtonLink size="sm" variant="ghost" to={`${match.id}/edit`}>
										<Icon name="pencil-1" />
									</ButtonLink>
									<DeleteButton
										schema={DeleteFormSchema}
										intent="delete-match"
										size="sm"
										action={action}
										id={match.id}
										clubId={data.clubId ?? ''}
									/>
								</ButtonGroup>
							</Td>
						</tr>
					))}
				</tbody>
			</Table>
			<Outlet />
		</div>
	)
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-match'),
	id: z.string(),
	clubId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	await requireUserId(request)
	const formData = await request.formData()

	const submission = parse(formData, {
		schema: DeleteFormSchema,
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

	const match = await prisma.match.findFirst({
		select: { id: true },
		where: {
			id: id,
		},
	})

	if (!match) {
		submission.error.id = ['Match not found']
		return json({ status: 'error', submission } as const, {
			status: 404,
		})
	}

	await prisma.match.delete({
		where: { id: match.id },
	})

	return redirectWithToast(`/clubs/${clubId}/matches`, {
		title: 'Match removed',
		variant: 'destructive',
	})
}
