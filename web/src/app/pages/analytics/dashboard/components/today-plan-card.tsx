import { format } from 'date-fns'
import { CheckCircle2, Circle, Clock3, CalendarOff } from 'lucide-react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { PLAN_DOT } from '@/features/plans/model/plan-colors'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'
import { cn } from '@/lib/utils'
import type { ITodayPlanInsight, TTodayPlanState } from '../model/dashboard-insights'

const STATE_META: Record<
	TTodayPlanState,
	{ label: string; icon: typeof Circle; className: string }
> = {
	recorded: { label: 'Recorded', icon: CheckCircle2, className: 'text-emerald-600 dark:text-emerald-400' },
	now: { label: 'Now', icon: Clock3, className: 'text-emerald-600 dark:text-emerald-400' },
	upcoming: { label: 'Upcoming', icon: Circle, className: 'text-blue-600 dark:text-blue-400' },
	past: { label: 'Past', icon: Circle, className: 'text-muted-foreground' },
}

interface TodayPlanCardProps {
	insight: ITodayPlanInsight
	className?: string
}

export function TodayPlanCard({ insight, className }: TodayPlanCardProps) {
	return (
		<Card className={cn('min-h-0', className)}>
			<CardHeader>
				<CardTitle>Today&apos;s plan</CardTitle>
				<CardDescription>
					{insight.items.length} {insight.items.length === 1 ? 'block' : 'blocks'} ·{' '}
					{formatMinutes(insight.totalMinutes)} planned
				</CardDescription>
			</CardHeader>

			<CardContent className="styled-scrollbar min-h-0 flex-1 overflow-y-auto">
				{insight.items.length > 0 ? (
					<div className="divide-y divide-border/70">
						{insight.items.map((item) => {
							const state = STATE_META[item.state]
							const StateIcon = state.icon

							return (
								<div className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0" key={item.plan.id}>
									<span className={cn('mt-1.5 size-2 shrink-0 rounded-full', PLAN_DOT[item.plan.color])} />

									<div className="w-21 shrink-0 text-xs tabular-nums text-muted-foreground">
										<div className="text-foreground">{format(item.startDate, 'p')}</div>
										<div>{format(item.endDate, 'p')}</div>
									</div>

									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{item.plan.title}</p>
										<p className="truncate text-xs text-muted-foreground">
											{item.taskTitle ?? formatMinutes(item.durationMinutes)}
										</p>
									</div>

									<span className={cn('flex shrink-0 items-center gap-1 text-xs', state.className)}>
										<StateIcon className="size-3" />
										{state.label}
									</span>
								</div>
							)
						})}
					</div>
				) : (
					<div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center">
						<CalendarOff className="size-5 text-muted-foreground" />
						<div>
							<p className="font-medium">Nothing planned for today</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Plans added to today will appear here.
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
