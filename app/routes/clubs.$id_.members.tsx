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
		<div className="container pt-12">
			<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
				<h1 className="text-h1">Members</h1>
				<NavLink to="new">
					<Icon name="plus">New Member</Icon>
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
						{data.members.map(member => (
							<tr key={member.id}>
								<td>{member.name}</td>
								<td>{member.id}</td>
								<td>
									<DeleteButton
										id={member.id}
										clubId={data.clubId ?? ''}
										action={action}
										schema={DeleteFormSchema}
										intent="delete-member"
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
