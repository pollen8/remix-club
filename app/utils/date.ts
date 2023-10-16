import type { FieldConfig } from '@conform-to/react'

export const formatDate = (input: FieldConfig<string>) => {
	return input.defaultValue
		? new Date(input.defaultValue).toLocaleDateString('en-CA')
		: new Date().toLocaleDateString('en-CA')
}
