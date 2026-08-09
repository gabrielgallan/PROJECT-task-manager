'use client'

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

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

			<CardContent className="min-h-0 h-fit">
				<ChartContainer config={chartConfig} className="h-full min-h-0 w-full">
					<AreaChart accessibilityLayer data={chartData} margin={{ left: 6, right: 6 }}>
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

						<defs>
							<linearGradient id="fillPlanned" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-planned)" stopOpacity={0.8} />
								<stop offset="95%" stopColor="var(--color-planned)" stopOpacity={0.1} />
							</linearGradient>
							<linearGradient id="fillLogged" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--color-logged)" stopOpacity={0.8} />
								<stop offset="95%" stopColor="var(--color-logged)" stopOpacity={0.1} />
							</linearGradient>
						</defs>

						<Area
							dataKey="planned"
							type="natural"
							fill="url(#fillPlanned)"
							fillOpacity={0.4}
							stroke="var(--color-planned)"
						/>

						<Area
							dataKey="logged"
							type="natural"
							fill="url(#fillLogged)"
							fillOpacity={0.4}
							stroke="var(--color-logged)"
						/>

						<ChartLegend content={<ChartLegendContent />} className="flex justify-start" />
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
