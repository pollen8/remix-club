import type { PropsWithChildren } from 'react'

type Props = {}

export const ButtonGroup = ({ children }: PropsWithChildren<Props>) => {
	return <div className="flex">{children}</div>
}
