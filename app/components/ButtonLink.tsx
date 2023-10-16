import { Link } from '@remix-run/react'
import type { ComponentProps } from 'react'
import { buttonVariants } from './ui/button.js'
import { cn } from '~/utils/misc.ts'
import type { VariantProps } from 'class-variance-authority'

export interface ButtonLinkProps
	extends ComponentProps<typeof Link>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

export const ButtonLink = (props: ButtonLinkProps) => {
	const { variant, size, className, children, ...rest } = props
	return (
		<Link
			className={cn(buttonVariants({ variant, size, className }))}
			{...rest}
		>
			{children}
		</Link>
	)
}
