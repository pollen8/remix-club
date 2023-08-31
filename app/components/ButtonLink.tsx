import { Link } from '@remix-run/react'
import { ComponentProps } from 'react'
import { buttonVariants } from './ui/button.js'
import { cn } from '~/utils/misc.ts'
import { VariantProps } from 'class-variance-authority'

export interface ButtonLinkProps
	extends ComponentProps<typeof Link>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

export const ButtonLink = (props: ButtonLinkProps) => {
	const { variant, size, className } = props
	return (
		<Link
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
}
