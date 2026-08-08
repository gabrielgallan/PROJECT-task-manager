import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'
import { cn } from '@/lib/utils'

interface ITaskShare {
	id: string
	title: string
	minutes: number
}

/** The heatmap answers when the work happened; this answers what it was spent on. */
const TIME_BY_TASK_MOCK: ITaskShare[] = [
	{ id: 'task-1', title: 'Integração DAHUA', minutes: 1140 },
	{ id: 'task-2', title: 'POC de reconhecimento de placas', minutes: 780 },
	{ id: 'task-4', title: 'Revisão Auto Guide', minutes: 465 },
	{ id: 'task-6', title: 'Migração do banco de imagens', minutes: 300 },
	{ id: 'task-3', title: 'Correção de fuso horário nos logs', minutes: 180 },
]

interface ITimeByTaskCardProps {
	className?: string
}

export function TimeByTaskCard({ className }: ITimeByTaskCardProps) {
	const total = TIME_BY_TASK_MOCK.reduce((sum, task) => sum + task.minutes, 0)
	const longest = Math.max(...TIME_BY_TASK_MOCK.map((task) => task.minutes))

	return (
		<Card className={cn(['overflow-hidden', className])}>
			<CardHeader>
				<CardTitle>Where your time went</CardTitle>
				<CardDescription>Top tasks by logged time this month</CardDescription>
			</CardHeader>

			<CardContent className="flex flex-col gap-3">
				{TIME_BY_TASK_MOCK.map((task) => (
					<div key={task.id} className="flex flex-col gap-1.5">
						<div className="flex items-baseline justify-between gap-3">
							<span className="truncate text-sm">{task.title}</span>

							<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
								{formatMinutes(task.minutes)} · {Math.round((task.minutes / total) * 100)}%
							</span>
						</div>

						{/* The bar is a share, so it scales against the longest one. */}
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-[var(--chart-accent)]"
								style={{ width: `${(task.minutes / longest) * 100}%` }}
							/>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	)
}
