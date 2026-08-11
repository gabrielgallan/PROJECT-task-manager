'use client'

import { format } from 'date-fns'
import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

const chartDataBase = [
	{ date: '2026-05-01', planned: 8, logged: 7 },
	{ date: '2026-05-02', planned: 6, logged: 5 },
	{ date: '2026-05-03', planned: 4, logged: 6 },
	{ date: '2026-05-04', planned: 8, logged: 8 },
	{ date: '2026-05-05', planned: 7, logged: 6 },
	{ date: '2026-05-06', planned: 8, logged: 9 },
	{ date: '2026-05-07', planned: 6, logged: 7 },
	{ date: '2026-05-08', planned: 8, logged: 8 },
	{ date: '2026-05-09', planned: 5, logged: 4 },
	{ date: '2026-05-10', planned: 3, logged: 4 },
	{ date: '2026-05-11', planned: 8, logged: 7 },
	{ date: '2026-05-12', planned: 7, logged: 8 },
	{ date: '2026-05-13', planned: 8, logged: 6 },
	{ date: '2026-05-14', planned: 6, logged: 7 },
	{ date: '2026-05-15', planned: 8, logged: 9 },
	{ date: '2026-05-16', planned: 4, logged: 5 },
	{ date: '2026-05-17', planned: 3, logged: 2 },
	{ date: '2026-05-18', planned: 8, logged: 8 },
	{ date: '2026-05-19', planned: 7, logged: 6 },
	{ date: '2026-05-20', planned: 8, logged: 7 },
	{ date: '2026-05-21', planned: 6, logged: 8 },
	{ date: '2026-05-22', planned: 8, logged: 7 },
	{ date: '2026-05-23', planned: 5, logged: 6 },
	{ date: '2026-05-24', planned: 2, logged: 3 },
	{ date: '2026-05-25', planned: 8, logged: 9 },
	{ date: '2026-05-26', planned: 7, logged: 7 },
	{ date: '2026-05-27', planned: 8, logged: 6 },
	{ date: '2026-05-28', planned: 6, logged: 7 },
	{ date: '2026-05-29', planned: 8, logged: 8 },
	{ date: '2026-05-30', planned: 4, logged: 5 },
	{ date: '2026-05-31', planned: 3, logged: 4 },

	{ date: '2026-06-01', planned: 8, logged: 7 },
	{ date: '2026-06-02', planned: 7, logged: 8 },
	{ date: '2026-06-03', planned: 8, logged: 9 },
	{ date: '2026-06-04', planned: 6, logged: 5 },
	{ date: '2026-06-05', planned: 8, logged: 7 },
	{ date: '2026-06-06', planned: 5, logged: 6 },
	{ date: '2026-06-07', planned: 3, logged: 2 },
	{ date: '2026-06-08', planned: 8, logged: 8 },
	{ date: '2026-06-09', planned: 7, logged: 6 },
	{ date: '2026-06-10', planned: 8, logged: 7 },
	{ date: '2026-06-11', planned: 6, logged: 8 },
	{ date: '2026-06-12', planned: 8, logged: 9 },
	{ date: '2026-06-13', planned: 4, logged: 5 },
	{ date: '2026-06-14', planned: 2, logged: 3 },
	{ date: '2026-06-15', planned: 8, logged: 7 },
	{ date: '2026-06-16', planned: 7, logged: 8 },
	{ date: '2026-06-17', planned: 8, logged: 6 },
	{ date: '2026-06-18', planned: 6, logged: 7 },
	{ date: '2026-06-19', planned: 8, logged: 8 },
	{ date: '2026-06-20', planned: 5, logged: 4 },
	{ date: '2026-06-21', planned: 3, logged: 4 },
	{ date: '2026-06-22', planned: 8, logged: 9 },
	{ date: '2026-06-23', planned: 7, logged: 7 },
	{ date: '2026-06-24', planned: 8, logged: 6 },
	{ date: '2026-06-25', planned: 6, logged: 8 },
	{ date: '2026-06-26', planned: 8, logged: 7 },
	{ date: '2026-06-27', planned: 4, logged: 5 },
	{ date: '2026-06-28', planned: 2, logged: 3 },
	{ date: '2026-06-29', planned: 8, logged: 8 },
	{ date: '2026-06-30', planned: 7, logged: 6 },

	{ date: '2026-07-01', planned: 8, logged: 7 },
	{ date: '2026-07-02', planned: 6, logged: 8 },
	{ date: '2026-07-03', planned: 8, logged: 9 },
	{ date: '2026-07-04', planned: 5, logged: 4 },
	{ date: '2026-07-05', planned: 3, logged: 2 },
	{ date: '2026-07-06', planned: 8, logged: 8 },
	{ date: '2026-07-07', planned: 7, logged: 6 },
	{ date: '2026-07-08', planned: 8, logged: 7 },
	{ date: '2026-07-09', planned: 6, logged: 7 },
	{ date: '2026-07-10', planned: 8, logged: 9 },
	{ date: '2026-07-11', planned: 4, logged: 5 },
	{ date: '2026-07-12', planned: 2, logged: 3 },
	{ date: '2026-07-13', planned: 8, logged: 7 },
	{ date: '2026-07-14', planned: 7, logged: 8 },
	{ date: '2026-07-15', planned: 8, logged: 6 },
	{ date: '2026-07-16', planned: 6, logged: 7 },
	{ date: '2026-07-17', planned: 8, logged: 8 },
	{ date: '2026-07-18', planned: 5, logged: 6 },
	{ date: '2026-07-19', planned: 3, logged: 4 },
	{ date: '2026-07-20', planned: 8, logged: 9 },
	{ date: '2026-07-21', planned: 7, logged: 7 },
	{ date: '2026-07-22', planned: 8, logged: 6 },
	{ date: '2026-07-23', planned: 6, logged: 8 },
	{ date: '2026-07-24', planned: 8, logged: 7 },
	{ date: '2026-07-25', planned: 4, logged: 5 },
	{ date: '2026-07-26', planned: 2, logged: 3 },
	{ date: '2026-07-27', planned: 8, logged: 8 },
	{ date: '2026-07-28', planned: 7, logged: 6 },
	{ date: '2026-07-29', planned: 8, logged: 9 },
	{ date: '2026-07-30', planned: 6, logged: 7 },
	{ date: '2026-07-31', planned: 8, logged: 8 },
	{ date: '2026-08-01', planned: 4, logged: 5 },
	{ date: '2026-08-02', planned: 2, logged: 3 },
	{ date: '2026-08-03', planned: 8, logged: 7 },
	{ date: '2026-08-04', planned: 7, logged: 8 },
	{ date: '2026-08-05', planned: 8, logged: 6 },
	{ date: '2026-08-06', planned: 6, logged: 7 },
	{ date: '2026-08-07', planned: 8, logged: 8 },
	{ date: '2026-08-08', planned: 5, logged: 6 },
	{ date: '2026-08-09', planned: 3, logged: 4 },
	{ date: '2026-08-10', planned: 8, logged: 5 },
]

const chartData = chartDataBase.map((day, index, days) => {
	const previous = days[Math.max(0, index - 1)]
	const next = days[Math.min(days.length - 1, index + 1)]
	const plannedAverage = (previous.planned + day.planned + next.planned) / 3
	const loggedAverage = (previous.logged + day.logged + next.logged) / 3

	return {
		date: day.date,
		planned: Number((plannedAverage + Math.sin(index / 4.8) * 0.9).toFixed(2)),
		logged: Number((loggedAverage + Math.sin((index + 2) / 5.6) * 0.75).toFixed(2)),
	}
})

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

const TIME_RANGE_DAYS = {
	'90d': 90,
	'30d': 30,
	'7d': 7,
} as const

type TTimeRange = keyof typeof TIME_RANGE_DAYS

export function PlannedVsLoggedChart({ className }: PlannedVsLoggedChartProps) {
	const [timeRange, setTimeRange] = useState<TTimeRange>('90d')
	const visibleData = chartData.slice(-TIME_RANGE_DAYS[timeRange])

	const handleTimeRangeChange = (value: string) => {
		if (value in TIME_RANGE_DAYS) {
			setTimeRange(value as TTimeRange)
		}
	}

	return (
		<Card className={cn(['overflow-hidden', className])}>
			<CardHeader>
				<CardTitle>Planned vs. logged work</CardTitle>

				<CardAction>
					<ToggleGroup
						value={[timeRange]}
						onValueChange={(values) => handleTimeRangeChange(values[0] ?? '')}
						className="hidden md:flex"
					>
						<ToggleGroupItem value="90d">3 months</ToggleGroupItem>
						<ToggleGroupItem value="30d">30 days</ToggleGroupItem>
						<ToggleGroupItem value="7d">7 days</ToggleGroupItem>
					</ToggleGroup>

					<Select value={timeRange} onValueChange={(value) => handleTimeRangeChange(value ?? '')}>
						<SelectTrigger className="flex md:hidden">
							<SelectValue placeholder="3 months" />
						</SelectTrigger>

						<SelectContent align="end">
							<SelectItem value="90d" className="rounded-lg">
								3 months
							</SelectItem>
							<SelectItem value="30d" className="rounded-lg">
								30 days
							</SelectItem>
							<SelectItem value="7d" className="rounded-lg">
								7 days
							</SelectItem>
						</SelectContent>
					</Select>
				</CardAction>
			</CardHeader>

			<CardContent className="min-h-0 h-full">
				<ChartContainer config={chartConfig} className="h-full min-h-0 w-full">
					<AreaChart accessibilityLayer data={visibleData} margin={{ left: 12, right: 12 }}>
						<CartesianGrid vertical={false} />

						<XAxis
							dataKey="date"
							axisLine={false}
							tickLine={false}
							tickMargin={8}
							tickFormatter={(value) => format(value, 'dd MMM')}
							minTickGap={24}
							padding={{ left: 8, right: 8 }}
						/>

						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent labelFormatter={(value) => format(value, 'MMMM dd, yyyy')} />
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
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
