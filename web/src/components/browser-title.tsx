import { Helmet } from 'react-helmet-async'

type BrowserTitleProps = {
	title?: string
}

export function BrowserTitle({ title }: BrowserTitleProps) {
	return (
		<Helmet>
			<title>{title ? `${title} - task_manager` : 'task_manager'}</title>
		</Helmet>
	)
}
