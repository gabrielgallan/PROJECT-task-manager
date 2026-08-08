import { RadialMetricCard } from '@/components/radial-metric-card'

interface CapacityCardProps {
	plannedMinutes: number
	weeklyCapacityMinutes: number
}

export function CapacityCard({ plannedMinutes, weeklyCapacityMinutes }: CapacityCardProps) {
	return (
		<RadialMetricCard
			title="Weekly capacity"
			currentMinutes={plannedMinutes}
			totalMinutes={weeklyCapacityMinutes}
			description={(planned, capacity) => `${planned} of ${capacity} allocated`}
			warnOnOverflow
		/>
	)
}
