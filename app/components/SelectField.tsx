import { FormGroup } from './FormGroup.js'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select.tsx'
import { FieldConfig, conform } from '@conform-to/react'
import { ErrorList } from './forms.js'
import { PropsWithRef, useId } from 'react'

const isId = (
	option: string[] | { id: string; name: string }[],
): option is { id: string; name: string }[] => {
	return option.length > 0 && option[0].hasOwnProperty('id')
}
type Props = {
	options: string[] | { id: string; name: string }[]
	field: FieldConfig<string>
	placeHolder: string
	width?: string
}
export const SelectField = ({
	options,
	field,
	placeHolder,
	ref,
	width,
}: PropsWithRef<Props>) => {
	const normalOptions = !isId(options)
		? options.map(o => ({ id: o, name: o }))
		: options

	const fallbackId = useId()
	const id = field.id ?? field.name ?? fallbackId
	const errorId = field.errors?.length ? `${id}-error` : undefined

	return (
		<FormGroup>
			<Select {...conform.input(field)}>
				<SelectTrigger className={`w-[${width ?? '240px'}]`}>
					<SelectValue placeholder={placeHolder} />
				</SelectTrigger>
				<SelectContent>
					{normalOptions.map(option => (
						<SelectItem key={option.id} value={option.id}>
							{option.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<div className="min-h-[32px] px-2 pb-3 pt-1">
				{errorId && <ErrorList errors={field.errors} id={field.errorId} />}
			</div>
		</FormGroup>
	)
}
