import { FieldConfig, conform } from '@conform-to/react'

type Props = {
	items: { value: string; label: string; id: string }[]
	field: FieldConfig<string[]>
	label: string
}

export const MultiCheckbox = ({ label, items, field }: Props) => {
	return (
		<fieldset>
			<legend>{label}</legend>

			{conform
				.collection(field, {
					type: 'checkbox',
					options: items.map(({ value }) => value),
				})

				.map((props, index) => {
					return (
						<div key={index}>
							<input {...props} />
							<label htmlFor={props.id}>
								{items.find(item => item.value === props.value)?.label}
							</label>
						</div>
					)
				})}

			<div>{field.error}</div>
		</fieldset>
	)
}
