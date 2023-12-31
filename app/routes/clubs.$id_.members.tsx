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
		<>
			<TableTitle>
				<h2 className="text-h2">Members</h2>
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
							<Td>{member.firstName + ' ' + member.lastName}</Td>
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
		</>
	)
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-member'),
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

	const member = await prisma.clubMembershipTypes.findFirst({
		select: { id: true },
		where: {
			id: id,
		},
	})

	if (!member) {
		submission.error.id = ['Membership type not found']
		return json({ status: 'error', submission } as const, {
			status: 404,
		})
	}

	await prisma.clubMembershipTypes.delete({
		where: { id: member.id },
	})

	return redirectWithToast(`/clubs/${clubId}/membershipTypes`, {
		title: 'Membership type removed',
		variant: 'destructive',
	})
}
