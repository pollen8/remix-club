import { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '~/utils/misc.ts'

export const FormActions = ({
	children,
	className,
	...rest
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => {
	return (
		<div
			{...rest}
			className={cn('mt-6 flex w-full justify-between', className)}
		>
			{children}
		</div>
	)
}
