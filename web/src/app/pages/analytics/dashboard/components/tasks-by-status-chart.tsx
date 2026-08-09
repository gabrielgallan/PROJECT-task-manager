'use client'

import React from 'react'
import { Label, Pie, PieChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

const chartData = [
	{ status: 'done', tasks: 275, fill: 'var(--color-done)' },
	{ status: 'backlog', tasks: 200, fill: 'var(--color-backlog)' },
	{ status: 'in_process', tasks: 287, fill: 'var(--color-in_process)' },
	{ status: 'overdue', tasks: 173, fill: 'var(--color-overdue)' },
]
const chartConfig = {
	tasks: {
		label: 'Tasks',
	},
	done: {
		label: 'Done',
		color: 'oklch(69.6% 0.17 162.48)',
	},
	backlog: {
		label: 'Backlog',
		color: 'oklch(55.4% 0.046 257.417)',
	},
	in_process: {
		label: 'In process',
		color: 'oklch(76.9% 0.188 70.08)',
	},
	overdue: {
		label: 'Overdue',
		color: 'oklch(64.5% 0.246 16.439)',
	},
} satisfies ChartConfig

interface TasksByStatusChartProps {
	className?: string
}

export function TasksByStatusChart({ className }: TasksByStatusChartProps) {
	const totalTasks = React.useMemo(() => {
		return chartData.reduce((acc, curr) => acc + curr.tasks, 0)
	}, [])

	return (
		<Card className={cn(['overflow-hidden', className])}>
			<CardHeader>
				<CardTitle>Tasks by status</CardTitle>
			</CardHeader>

			<CardContent className="min-h-0 flex-1">
				<ChartContainer config={chartConfig} className="h-full min-h-0 w-full">
					<PieChart>
						<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />

						<Pie
							data={chartData}
							dataKey="tasks"
							nameKey="status"
							outerRadius="75%"
							innerRadius="45%"
							stroke="var(--card)"
							strokeWidth={8}
						>
							<Label
								content={({ viewBox }) => {
									if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor="middle"
												dominantBaseline="middle"
											>
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className="fill-foreground text-2xl font-bold"
												>
													{totalTasks.toLocaleString()}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
													className="fill-muted-foreground"
												>
													tasks
												</tspan>
											</text>
										)
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
