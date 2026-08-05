import { BrowserTitle } from '@/components/browser-title'
import { ExampleGantt } from '@/components/gantt'

export function WorkLogsPage() {
	return (
		<>
			<BrowserTitle title="Plans" />

			<div className="styled-scrollbar flex min-h-0 flex-1 flex-col">
				<ExampleGantt />
			</div>
		</>
	)
}
