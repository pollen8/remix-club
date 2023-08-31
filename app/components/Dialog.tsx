import { useNavigate } from '@remix-run/react'
import { PropsWithChildren } from 'react'
import { Button } from './ui/button.tsx'
import { Icon } from './ui/icon.tsx'

export const DialogBg = ({ children }: PropsWithChildren<{}>) => {
	return (
		<div className="fixed left-0 top-0 h-full w-full bg-grey-900 bg-opacity-90">
			{children}
		</div>
	)
}

export const Dialog = ({ children }: PropsWithChildren<{}>) => {
	return (
		<DialogBg>
			<div className="m-auto mt-6 w-1/2 bg-grey-600 p-6">{children}</div>
		</DialogBg>
	)
}
export const DialogHeader = ({ children }: PropsWithChildren<{}>) => {
	const navigate = useNavigate()

	return (
		<div className="flex justify-between">
			<h2 className="mb-6 text-h2">{children}</h2>
			<Button variant="outline" type="button" onClick={() => navigate(-1)}>
				<Icon name="cross-1" />
			</Button>
		</div>
	)
}
