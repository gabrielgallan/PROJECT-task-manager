import { AlertTriangle } from 'lucide-react'
import { MetricCard } from '@/components/metric-card'

interface OverdueTasksCardProps {
	overdueCount: number
	overdueForMoreThan7DaysCount: number
}

export function OverdueTasksCard({ overdueCount }: OverdueTasksCardProps) {
	return (
		<MetricCard
			title="Overdue tasks"
			count={overdueCount}
			icon={AlertTriangle}
			iconClassName="text-rose-500 bg-rose-500/20"
		/>
	)
}
