import { BrowserTitle } from '@/components/browser-title'
import { PlansCalendar } from '@/features/plans/calendar/plans-calendar'
import { PLANS_MOCK } from '@/features/plans/mocks/plans'

export function WorkLogsPage() {
	return (
		<>
			<BrowserTitle title="Plans" />

			<div className="flex min-h-0 flex-1 flex-col">
				<PlansCalendar plans={PLANS_MOCK} />
			</div>
		</>
	)
}
