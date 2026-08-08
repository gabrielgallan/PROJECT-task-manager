import { RadialMetricCard } from '@/components/radial-metric-card'

interface PlannedVsLoggedCardProps {
	loggedMinutes: number
	plannedMinutes: number
}

export function PlannedVsLoggedCard({ loggedMinutes, plannedMinutes }: PlannedVsLoggedCardProps) {
	return (
		<RadialMetricCard
			title="Logged hours"
			currentMinutes={loggedMinutes}
			totalMinutes={plannedMinutes}
			description={(logged, planned) => `${logged} of ${planned} planned`}
		/>
	)
}
