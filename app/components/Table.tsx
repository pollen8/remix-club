import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '~/utils/misc.ts'

export const Table = ({
	children,
	className,
	...rest
}: PropsWithChildren<HTMLAttributes<HTMLTableElement>>) => {
	return (
		<table
			{...rest}
			className={cn('mt-6 w-full rounded-sm bg-grey-500 	', className)}
		>
			{children}
		</table>
	)
}

export const Th = ({
	children,
	className,
	...rest
}: PropsWithChildren<HTMLAttributes<HTMLTableCellElement>>) => {
	return (
		<th {...rest} className={cn('p-4 pb-2 pt-2 text-left', className)}>
			{children}
		</th>
	)
}

export const Td = ({
	children,
	className,
	...rest
}: PropsWithChildren<HTMLAttributes<HTMLTableCellElement>>) => {
	return (
		<td {...rest} className={cn('bg-grey-400 pl-4 pr-4 text-left', className)}>
			{children}
		</td>
	)
}
