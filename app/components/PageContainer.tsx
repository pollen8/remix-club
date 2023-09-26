import { PropsWithChildren } from 'react'

export const PageContainer = ({ children }: PropsWithChildren<{}>) => {
	return <div className="container pt-6">{children}</div>
}
