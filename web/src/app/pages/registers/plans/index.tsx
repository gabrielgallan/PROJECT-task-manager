import { BrowserTitle } from '@/components/browser-title'
import { Calendar } from '@/features/calendar/calendar'
import { PLANS_MOCK } from '@/features/calendar/mocks'

export function PlansPage() {
	return (
		<>
			<BrowserTitle title="Plans" />

			<div className="flex min-h-0 flex-1 flex-col">
				<Calendar plans={PLANS_MOCK} defaultView="week" />
			</div>
		</>
	)
}
