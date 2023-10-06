import { FetcherWithComponents } from '@remix-run/react'
import { Icon } from './ui/icon.tsx'
import { StatusButton } from './ui/status-button.tsx'

type Props = {
	fetcher: FetcherWithComponents<any>
}

export const SubmitButton = ({ fetcher }: Props) => {
	return (
		<StatusButton
			status={
				fetcher.state === 'submitting'
					? 'pending'
					: fetcher.data?.status ?? 'idle'
			}
			type="submit"
			disabled={fetcher.state !== 'idle'}
			className="min-[525px]:max-md:aspect-square min-[525px]:max-md:px-0"
		>
			<Icon name="arrow-right" className="scale-125 max-md:scale-150 md:mr-2" />
			<span className="max-md:hidden">Submit</span>
		</StatusButton>
	)
}
