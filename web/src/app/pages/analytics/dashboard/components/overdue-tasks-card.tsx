import { AlertTriangle } from 'lucide-react'
import { MetricCard } from '@/components/metric-card'

interface OverdueTasksCardProps {
	overdueCount: number
	overdueForMoreThan7DaysCount: number
}

export function OverdueTasksCard({
	overdueCount,
	overdueForMoreThan7DaysCount,
}: OverdueTasksCardProps) {
	const description =
		overdueCount === 0
			? 'No overdue tasks'
			: overdueForMoreThan7DaysCount > 0
				? `${overdueForMoreThan7DaysCount} overdue for more than 7 days`
				: 'All overdue tasks are recent'

	return (
		<MetricCard
			title="Overdue tasks"
			count={overdueCount}
			description={description}
			icon={AlertTriangle}
			iconClassName="text-rose-500 bg-rose-500/20"
		/>
	)
}
