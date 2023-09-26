import {
	DataFunctionArgs,
	HeadersFunction,
	json,
	redirect,
} from '@remix-run/node'
import { Link, NavLink, useLoaderData } from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import {
	combineServerTimings,
	makeTimings,
	time,
} from '~/utils/timing.server.ts'
import { prisma } from '~/utils/db.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	const timings = makeTimings('clubs loader')
	const searchTerm = new URL(request.url).searchParams.get('search')
	if (searchTerm === '') {
		return redirect('/clubs')
	}

	const clubs = await time(
		() =>
			prisma.club.findMany({
				select: {
					id: true,
					name: true,
				},
			}),
		{ timings, type: 'find clubs' },
	)
	return json({ clubs }, { headers: { 'Server-Timing': timings.toString() } })
}

export const headers: HeadersFunction = ({ loaderHeaders, parentHeaders }) => {
	return {
		'Server-Timing': combineServerTimings(parentHeaders, loaderHeaders),
	}
}

/**
 * Page shown when not further route applicable
 */
export default function ClubsIndexRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="container pt-12">
			<div className="container mb-48 mt-36 flex flex-col items-center justify-center gap-6">
				<h1 className="text-h1">Clubs</h1>
				<NavLink to="new">
					<Icon name="plus">New Club</Icon>
				</NavLink>
				<ul className="flex w-full flex-wrap items-center justify-center gap-4">
					{data.clubs.map(club => (
						<li key={club.id}>
							<Link
								to={club.id}
								className="flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-muted px-5 py-3"
							>
								<span className="w-full overflow-hidden text-ellipsis text-center text-body-sm text-muted-foreground">
									{club.name}
								</span>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
