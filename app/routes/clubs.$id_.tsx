import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import {
	Form,
	Link,
	NavLink,
	Outlet,
	useActionData,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '@remix-run/react'
import { formatDistanceToNow } from 'date-fns'
import { z } from 'zod'
import { PageContainer } from '~/components/PageContainer.tsx'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { ErrorList } from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import {
	Menubar,
	MenubarMenu,
	MenubarTrigger,
} from '~/components/ui/menubar.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { getUserId, requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { getDateTimeFormat } from '~/utils/misc.ts'

export async function loader({ request, params }: DataFunctionArgs) {
	const userId = await getUserId(request)
	const club = await prisma.club.findUnique({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			name: true,
			description: true,
			updatedAt: true,
			createdAt: true,
			createdById: true,
		},
	})
	if (!club) {
		throw new Response('Not found', { status: 404 })
	}
	const date = new Date(club.updatedAt)
	const timeAgo = formatDistanceToNow(date)
	return json({
		club,
		timeAgo,
		dateDisplay: getDateTimeFormat(request).format(date),
		isOwner: userId === club.createdById,
	})
}

const DeleteFormSchema = z.object({
	intent: z.literal('delete-club'),
	clubId: z.string(),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
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

	const { clubId } = submission.value

	const club = await prisma.club.findFirst({
		select: { id: true },
		where: {
			id: clubId,
			createdById: userId,
		},
	})
	if (!club) {
		submission.error.clubId = ['Club not found']
		return json({ status: 'error', submission } as const, {
			status: 404,
		})
	}

	await prisma.club.delete({
		where: { id: club.id },
	})

	return redirectWithToast(`/clubs`, {
		title: 'Club deleted',
		variant: 'destructive',
	})
}

export default function ClubRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<PageContainer>
			<div className="flex items-center justify-between">
				<h1 className="text-h1">{data.club.name}</h1>
				{data.isOwner ? (
					<div>
						<div className="grid flex-1 grid-cols-2 justify-end gap-2 min-[525px]:flex md:gap-4">
							<DeleteClub id={data.club.id} />
							<Button
								asChild
								variant="ghost"
								className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
							>
								<Link to="edit">
									<Icon
										name="pencil-1"
										className="scale-125 max-md:scale-150 md:mr-2"
									/>
									<span className="max-md:hidden">Edit</span>
								</Link>
							</Button>
						</div>
					</div>
				) : null}
			</div>

			<Menubar>
				<MenubarMenu>
					<MenubarTrigger className="cursor-pointer" asChild>
						<Link to="members">
							<Icon name="person">Members</Icon>
						</Link>
					</MenubarTrigger>
					<MenubarTrigger className="cursor-pointer" asChild>
						<Link to="seasons">
							<Icon name="calendar-month">Seasons</Icon>
						</Link>
					</MenubarTrigger>
					<MenubarTrigger className="cursor-pointer" asChild>
						<Link to="teams">
							<Icon name="calendar-month">Teams</Icon>
						</Link>
					</MenubarTrigger>
					<MenubarTrigger className="cursor-pointer" asChild>
						<Link to="matches">
							<Icon name="person">Matches</Icon>
						</Link>
					</MenubarTrigger>
					<MenubarTrigger className="cursor-pointer" asChild>
						<Link to="membershipTypes">
							<Icon name="person">Membership Types</Icon>
						</Link>
					</MenubarTrigger>
				</MenubarMenu>
			</Menubar>
			<div className="mt-10">
				<Outlet />
			</div>
		</PageContainer>
	)
}

export function DeleteClub({ id }: { id: string }) {
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const formAction = useFormAction()
	const [form] = useForm({
		id: 'delete-club',
		lastSubmission: actionData?.submission,
		constraint: getFieldsetConstraint(DeleteFormSchema),
		onValidate({ formData }) {
			return parse(formData, { schema: DeleteFormSchema })
		},
	})
	return (
		<Form method="post" {...form.props}>
			<input type="hidden" name="clubId" value={id} />
			<StatusButton
				type="submit"
				name="intent"
				value="delete-club"
				variant="destructive"
				status={
					navigation.state === 'submitting' &&
					navigation.formAction === formAction &&
					navigation.formData?.get('intent') === 'delete-club' &&
					navigation.formMethod === 'POST'
						? 'pending'
						: actionData?.status ?? 'idle'
				}
				disabled={navigation.state !== 'idle'}
				className="w-full max-md:aspect-square max-md:px-0"
			>
				<Icon name="trash" className="scale-125 max-md:scale-150 md:mr-2" />
				<span className="max-md:hidden">Delete</span>
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</Form>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>Club not found</p>,
			}}
		/>
	)
}
