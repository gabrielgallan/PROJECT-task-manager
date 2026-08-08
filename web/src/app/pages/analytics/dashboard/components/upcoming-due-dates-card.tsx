import { CalendarClock } from 'lucide-react'
import { MetricCard } from '@/components/metric-card'

interface UpcomingDueDatesCardProps {
	dueTodayCount: number
	dueNext7DaysCount: number
}

export function UpcomingDueDatesCard({
	dueTodayCount,
	dueNext7DaysCount,
}: UpcomingDueDatesCardProps) {
	const total = dueTodayCount + dueNext7DaysCount

	const description =
		total === 0
			? 'No upcoming due dates'
			: `${dueTodayCount} due today · ${dueNext7DaysCount} due in the next 7 days`

	return (
		<MetricCard
			title="Upcoming due dates"
			count={total}
			description={description}
			icon={CalendarClock}
			iconClassName="text-primary"
		/>
	)
}
