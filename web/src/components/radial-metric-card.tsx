import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { type ChartConfig, ChartContainer } from '@/components/ui/chart'

const chartConfig = {
	capacity: {
		label: 'Capacity',
		color: 'var(--chart-accent)',
	},
} satisfies ChartConfig

function formatDuration(minutes: number) {
	const hours = Math.floor(minutes / 60)
	const remainingMinutes = minutes % 60

	if (hours === 0) return `${remainingMinutes}min`
	if (remainingMinutes === 0) return `${hours}h`

	return `${hours}h${String(remainingMinutes).padStart(2, '0')}`
}

interface RadialMetricCardProps {
	title: string
	currentMinutes: number
	totalMinutes: number
	description: (current: string, total: string) => string
	/**
	 * Whether going over the total is a problem. Booking more than the weekly
	 * capacity is; logging more hours than planned is not.
	 */
	warnOnOverflow?: boolean
}

export function RadialMetricCard({
	title,
	currentMinutes,
	totalMinutes,
	description,
	warnOnOverflow = false,
}: RadialMetricCardProps) {
	const percentage = totalMinutes > 0 ? Math.round((currentMinutes / totalMinutes) * 100) : 0

	// O gráfico não deve ultrapassar 100%, mas o texto pode exibir, por exemplo, 112%.
	const chartPercentage = Math.min(percentage, 100)
	const isOverflowing = warnOnOverflow && percentage > 100

	const item = {
		current: currentMinutes,
		allowed: totalMinutes,
		capacity: chartPercentage,
	}

	return (
		<Card className="px-4 py-4">
			<CardContent className="p-0 flex items-center space-x-4">
				<div role="img" className="relative flex items-center justify-center">
					<ChartContainer config={chartConfig} className="h-24 w-22">
						<RadialBarChart
							data={[item]}
							innerRadius="70%"
							outerRadius="95%"
							barSize={6}
							startAngle={90}
							endAngle={-270}
						>
							<PolarAngleAxis
								type="number"
								domain={[0, 100]}
								angleAxisId={0}
								tick={false}
								axisLine={false}
							/>
							<RadialBar
								dataKey="capacity"
								background={{ fill: 'var(--muted)' }}
								cornerRadius={10}
								fill={isOverflowing ? 'var(--chart-warning)' : 'var(--chart-accent)'}
								angleAxisId={0}
							/>
						</RadialBarChart>
					</ChartContainer>

					<div className="absolute inset-0 flex items-center justify-center">
						<span className="text-base font-medium text-foreground">{percentage}%</span>
					</div>
				</div>

				<div>
					<dt className="text-sm font-medium text-foreground">{title}</dt>
					<dd className="text-sm text-muted-foreground">
						{description(formatDuration(currentMinutes), formatDuration(totalMinutes))}
					</dd>
				</div>
			</CardContent>
		</Card>
	)
}
