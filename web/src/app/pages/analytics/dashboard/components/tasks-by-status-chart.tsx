'use client'

import { useMemo } from 'react'
import { Label, Pie, PieChart } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import { TASK_STATUS_CHART_COLOR, TASK_STATUS_LABEL } from '@/features/tasks/model/task-status'
import { cn } from '@/lib/utils'

const chartData = [
	{ status: 'in_progress', tasks: 275, fill: 'var(--color-in_progress)' },
	{ status: 'backlog', tasks: 200, fill: 'var(--color-backlog)' },
	{ status: 'done', tasks: 187, fill: 'var(--color-done)' },
]

/** Labels and colours come from the task model, the same source as the badges. */
const chartConfig = {
	tasks: {
		label: 'Tasks',
	},
	in_progress: {
		label: TASK_STATUS_LABEL.in_progress,
		color: TASK_STATUS_CHART_COLOR.in_progress,
	},
	backlog: {
		label: TASK_STATUS_LABEL.backlog,
		color: TASK_STATUS_CHART_COLOR.backlog,
	},
	done: {
		label: TASK_STATUS_LABEL.done,
		color: TASK_STATUS_CHART_COLOR.done,
	},
} satisfies ChartConfig

interface TasksByStatusChartProps {
	className?: string
}

export function TasksByStatusChart({ className }: TasksByStatusChartProps) {
	const total = useMemo(() => chartData.reduce((sum, item) => sum + item.tasks, 0), [])

	return (
		<Card className={cn(['overflow-hidden', className])}>
			<CardHeader className="items-center pb-0">
				<CardTitle>Tasks by status</CardTitle>
				<CardDescription>All open and closed tasks</CardDescription>
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
							strokeWidth={5}
							cornerRadius={0}
						>
							<Label
								content={({ viewBox }) => {
									if (!viewBox || !('cx' in viewBox)) {
										return null
									}

									return (
										<text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
											<tspan
												x={viewBox.cx}
												y={viewBox.cy}
												className="fill-foreground text-xl font-semibold"
											>
												{total}
											</tspan>
											<tspan
												x={viewBox.cx}
												y={(viewBox.cy ?? 0) + 18}
												className="fill-muted-foreground text-xs"
											>
												tasks
											</tspan>
										</text>
									)
								}}
							/>
						</Pie>

						<ChartLegend
							layout="vertical"
							verticalAlign="bottom"
							align="left"
							content={<ChartLegendContent nameKey="status" />}
							className="flex flex-col items-start gap-2"
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
