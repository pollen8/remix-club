import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { z } from 'zod'
import { Button } from '~/components/ui/button.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { ErrorList, Field } from '~/components/forms.tsx'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { addYears } from 'date-fns'

export const SeasonEditorSchema = z.object({
	id: z.string().optional(),
	clubId: z.string(),
	name: z.string().min(1),
	start: z.string().pipe(z.coerce.date()),
	end: z.string().pipe(z.coerce.date()),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: SeasonEditorSchema,
		acceptMultipleErrors: () => true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	let season

	const { name, start, end, id, clubId } = submission.value

	const data = {
		name,
		start: start ?? new Date(),
		end: end ?? addYears(new Date(), 1),
		clubId: clubId,
	}

	const select = {
		id: true,
	}
	if (id) {
		const existingSeason = await prisma.season.findFirst({
			where: { id },
			select: { id: true },
		})
		if (!existingSeason) {
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 404 },
			)
		}
		season = await prisma.season.update({
			where: { id },
			data,
			select,
		})
	} else {
		season = await prisma.season.create({ data, select })
	}
	return redirectWithToast(`/clubs/${clubId}/seasons`, {
		title: id ? 'Season updated' : 'Season created',
	})
}

export function SeasonEditor({
	clubId,
	season,
}: {
	clubId: string
	season?: { id: string; name: string; start: string; end: string }
}) {
	const seasonEditorFetcher = useFetcher<typeof action>()
	const [form, fields] = useForm({
		id: 'season-editor',
		constraint: getFieldsetConstraint(SeasonEditorSchema),
		lastSubmission: seasonEditorFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: SeasonEditorSchema })
		},
		defaultValue: {
			name: season?.name,
			start: season?.start,
			end: season?.end,
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<seasonEditorFetcher.Form
			method="post"
			action="/resources/season-editor"
			className="flex h-full flex-col gap-y-4 overflow-x-hidden px-10 pb-28 pt-12"
			{...form.props}
		>
			<input name="clubId" type="hidden" value={clubId} />
			<input name="id" type="hidden" value={season?.id} />
			{season?.id ? 'Edit Season....' : 'Add Season'}
			<Field
				labelProps={{ children: 'Name' }}
				inputProps={{
					...conform.input(fields.name),
					autoFocus: true,
				}}
				errors={fields.name.errors}
				className="flex flex-col gap-y-2"
			/>
			<Field
				labelProps={{ children: 'Start date' }}
				inputProps={{
					type: 'date',
					...conform.input(fields.start),
				}}
				errors={fields.name.errors}
				className="flex flex-col gap-y-2"
			/>
			<Field
				labelProps={{ children: 'End date' }}
				inputProps={{
					type: 'date',
					...conform.input(fields.end),
				}}
				errors={fields.name.errors}
				className="flex flex-col gap-y-2"
			/>
			<ErrorList errors={form.errors} id={form.errorId} />
			<div>
				<Button
					variant="destructive"
					type="reset"
					className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
				>
					<Icon name="reset" className="scale-125 max-md:scale-150 md:mr-2" />
					<span className="max-md:hidden">Reset</span>
				</Button>
				<StatusButton
					status={
						seasonEditorFetcher.state === 'submitting'
							? 'pending'
							: seasonEditorFetcher.data?.status ?? 'idle'
					}
					type="submit"
					disabled={seasonEditorFetcher.state !== 'idle'}
					className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
				>
					<Icon
						name="arrow-right"
						className="scale-125 max-md:scale-150 md:mr-2"
					/>
					<span className="max-md:hidden">Submit</span>
				</StatusButton>
			</div>
		</seasonEditorFetcher.Form>
	)
}