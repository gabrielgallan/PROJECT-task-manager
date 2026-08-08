'use client'

import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'
import { cn } from '@/lib/utils'

const chartData = [
	{ label: 'Sun', planned: 90, logged: 110 },
	{ label: 'Mon', planned: 186, logged: 80 },
	{ label: 'Tue', planned: 305, logged: 200 },
	{ label: 'Wed', planned: 237, logged: 120 },
	{ label: 'Thu', planned: 73, logged: 190 },
	{ label: 'Fri', planned: 209, logged: 130 },
	{ label: 'Sat', planned: 214, logged: 140 },
]

/**
 * Intention and reality of the same quantity, so they share a hue and separate by
 * weight: planned is the lighter dashed line, logged the solid one.
 */
const chartConfig = {
	planned: {
		label: 'Planned',
		color: 'var(--chart-accent-soft)',
	},
	logged: {
		label: 'Logged',
		color: 'var(--chart-accent)',
	},
} satisfies ChartConfig

interface PlannedVsLoggedChartProps {
	className?: string
}

export function PlannedVsLoggedChart({ className }: PlannedVsLoggedChartProps) {
	return (
		<Card className={cn(['overflow-hidden', className])}>
			<CardHeader>
				<CardTitle>Planned - Logged</CardTitle>
				<CardDescription>Last 7 days</CardDescription>
			</CardHeader>

			<CardContent className="min-h-0 flex-1">
				<ChartContainer config={chartConfig} className="h-full min-h-0 w-full">
					<LineChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} />

						<XAxis
							dataKey="label"
							tickLine={false}
							axisLine={false}
							padding={{ left: 8, right: 8 }}
							tickMargin={10}
						/>

						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									formatter={(value, name) => [
										formatMinutes(Number(value)),
										chartConfig[name as keyof typeof chartConfig]?.label ?? name,
									]}
								/>
							}
						/>

						<Line
							dataKey="planned"
							stroke="var(--color-planned)"
							strokeDasharray="4 4"
							type="monotone"
							strokeWidth={2}
							dot={false}
						/>

						<Line
							dataKey="logged"
							stroke="var(--color-logged)"
							type="monotone"
							strokeWidth={2}
							dot={false}
						/>

						<ChartLegend content={<ChartLegendContent />} className="flex justify-start" />
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
