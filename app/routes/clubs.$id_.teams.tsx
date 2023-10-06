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
import { Table, Td, Th } from '~/components/Table.tsx'
import { ButtonLink } from '~/components/ButtonLink.tsx'
import { TableTitle } from '~/components/TableTitle.tsx'
import { Button } from '@react-email/components'
import { Link } from 'lucide-react'
import { ButtonGroup } from '~/components/ButtonGroup.tsx'

export async function loader({ request, params }: DataFunctionArgs) {
	const timings = makeTimings('club members loader')

	const teams = await time(
		() =>
			prisma.team.findMany({
				where: {
					clubId: params.id,
				},
			}),
		{ timings, type: 'find club teams' },
	)
	return json(
		{ teams, clubId: params.id },
		{ headers: { 'Server-Timing': timings.toString() } },
	)
}

export const headers: HeadersFunction = ({ loaderHeaders, parentHeaders }) => {
	return {
		'Server-Timing': combineServerTimings(parentHeaders, loaderHeaders),
	}
}

export default function ClubsTeamsIndexRoute() {
	const data = useLoaderData<typeof loader>()
	return (
		<>
			<TableTitle>
				<h2 className="text-h2">Teams</h2>
				<ButtonLink to="new">
					<Icon name="plus">New Team</Icon>
				</ButtonLink>
			</TableTitle>
			<Table>
				<thead>
					<tr>
						<Th>Name</Th>
						<Th>Type</Th>
						<Th></Th>
					</tr>
				</thead>
				<tbody>
					{/** @TODO  empty data cta */}
					{data.teams.map(team => (
						<tr key={team.id}>
							<Td>{team.name}</Td>
							<Td>{team.teamType}</Td>
							<Td className="w-20">
								<ButtonGroup>
									<ButtonLink size="sm" variant="ghost" to={`${team.id}/edit`}>
										<Icon name="pencil-1" />
									</ButtonLink>
									{/*** @TODO replace with modal confirmation */}
									<DeleteButton
										id={team.id}
										size="sm"
										clubId={data.clubId ?? ''}
										action={action}
										schema={DeleteFormSchema}
										intent="delete-team"
									/>
								</ButtonGroup>
							</Td>
						</tr>
					))}
				</tbody>
			</Table>
			<Outlet />
		</>
	)
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-team'),
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

	const team = await prisma.team.findFirst({
		select: { id: true },
		where: {
			id: id,
		},
	})

	if (!team) {
		submission.error.id = ['Team not found']
		return json({ status: 'error', submission } as const, {
			status: 404,
		})
	}

	await prisma.team.delete({
		where: { id: team.id },
	})

	return redirectWithToast(`/clubs/${clubId}/teams`, {
		title: 'Team removed',
		variant: 'destructive',
	})
}
