import { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '~/utils/misc.ts'

export const TableTitle = ({
	children,
	className,
	...rest
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => {
	return (
		<div
			{...rest}
			className={cn('flex w-full items-baseline justify-between', className)}
		>
			{children}
		</div>
	)
}
