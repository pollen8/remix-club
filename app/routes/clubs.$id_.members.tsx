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

export async function loader({ request, params }: DataFunctionArgs) {
	const timings = makeTimings('club members loader')

	const members = await time(
		() =>
			prisma.member.findMany({
				include: {
					clubs: true,
				},
				where: {
					clubs: {
						some: {
							id: params.id,
						},
					},
				},
			}),
		{ timings, type: 'find club members' },
	)
	return json(
		{ members, clubId: params.id },
		{ headers: { 'Server-Timing': timings.toString() } },
	)
}

export const headers: HeadersFunction = ({ loaderHeaders, parentHeaders }) => {
	return {
		'Server-Timing': combineServerTimings(parentHeaders, loaderHeaders),
	}
}

export default function ClubsMembersIndexRoute() {
	const data = useLoaderData<typeof loader>()
	return (
		<div className="container pt-6">
			<TableTitle>
				<h1 className="text-h1">Members</h1>
				<ButtonLink to="new">
					<Icon name="plus">New Member</Icon>
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
					{/** @TODO  empty data cta */}
					{data.members.map(member => (
						<tr key={member.id}>
							<Td>{member.name}</Td>
							<Td>{member.id}</Td>
							<Td className="w-1">
								{/*** @TODO replace with modal confirmation */}
								<DeleteButton
									id={member.id}
									size="sm"
									clubId={data.clubId ?? ''}
									action={action}
									schema={DeleteFormSchema}
									intent="delete-member"
								/>
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
	intent: z.literal('delete-member'),
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

	const member = await prisma.member.findFirst({
		select: { id: true },
		where: {
			id: id,
		},
	})

	if (!member) {
		submission.error.id = ['Member not found']
		return json({ status: 'error', submission } as const, {
			status: 404,
		})
	}

	await prisma.member.delete({
		where: { id: member.id },
	})

	return redirectWithToast(`/clubs/${clubId}/members`, {
		title: 'Member removed',
		variant: 'destructive',
	})
}
