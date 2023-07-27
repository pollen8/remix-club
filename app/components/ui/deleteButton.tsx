import {
	Form,
	useActionData,
	useFormAction,
	useNavigation,
} from '@remix-run/react'
import { Icon } from '~/components/ui/icon.tsx'
import { z } from 'zod'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { useForm } from '@conform-to/react'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { ErrorList } from '~/components/forms.tsx'

type Props = {
	id: string
	schema: z.ZodObject<any>
	clubId: string
	intent: string | undefined
	action: any
}

export function DeleteButton({ id, schema, clubId, intent, action }: Props) {
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const formAction = useFormAction()
	const [form] = useForm({
		id: intent,
		lastSubmission: actionData?.submission,
		constraint: getFieldsetConstraint(schema),
		onValidate({ formData }) {
			return parse(formData, { schema: schema })
		},
	})
	return (
		<Form method="post" {...form.props}>
			<input type="hidden" name="id" value={id} />
			<input type="hidden" name="clubId" value={clubId} />
			<StatusButton
				type="submit"
				name="intent"
				value={intent}
				variant="destructive"
				status={
					navigation.state === 'submitting' &&
					navigation.formAction === formAction &&
					navigation.formData?.get('intent') === intent &&
					navigation.formMethod === 'POST'
						? 'pending'
						: actionData?.status ?? 'idle'
				}
				disabled={navigation.state !== 'idle'}
				className="w-full max-md:aspect-square max-md:px-0"
			>
				<Icon name="trash" />
			</StatusButton>
			<ErrorList errors={form.errors} id={form.errorId} />
		</Form>
	)
}
