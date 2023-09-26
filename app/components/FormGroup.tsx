import { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '~/utils/misc.ts'

export const FormGroup = ({
	children,
	className,
	...rest
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => {
	return (
		<div {...rest} className={cn('mb-5', className)}>
			{children}
		</div>
	)
}
