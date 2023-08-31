import type { V2_MetaFunction } from '@remix-run/node'

export const meta: V2_MetaFunction = () => [{ title: 'Epic Notes' }]

export default function Index() {
	return <div>hello</div>
}
