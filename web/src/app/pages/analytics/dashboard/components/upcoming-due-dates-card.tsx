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

	return (
		<MetricCard
			title="Upcoming due dates"
			count={total}
			icon={CalendarClock}
			iconClassName="text-primary"
		/>
	)
}
