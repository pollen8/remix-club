import { FieldConfig, conform } from '@conform-to/react'

type Props = {
	items: { value: string; label: string; id: string }[]
	field: FieldConfig<string[]>
	label: string
}

export const MultiCheckbox = ({ label, items, field }: Props) => {
	const defaultValues = field?.defaultValue
	return (
		<fieldset>
			<legend className="mb-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
				{label}
			</legend>

			{conform
				.collection(field, {
					type: 'checkbox',
					options: items.map(({ value }) => value),
				})

				.map((props, index) => {
					const chx = defaultValues?.includes(props.value)
					return (
						<div key={index} className="mb-2">
							<input {...props} defaultChecked={chx} />
							<label className="pl-2" htmlFor={props.id}>
								{items.find(item => item.value === props.value)?.label}
							</label>
						</div>
					)
				})}

			<div>{field.error}</div>
		</fieldset>
	)
}
