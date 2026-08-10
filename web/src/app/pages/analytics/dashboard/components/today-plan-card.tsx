import { CalendarOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ICalendarItemRenderContext } from '@/features/calendar/types'
import { getPlanItemClassName, PlanItemContent } from '@/features/plans/calendar/plan-item-content'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'
import { cn } from '@/lib/utils'
import type { ITodayPlanInsight, ITodayPlanItem } from '../model/dashboard-insights'

function getRenderContext(item: ITodayPlanItem): ICalendarItemRenderContext {
	return {
		variant: 'agenda',
		startDate: item.startDate,
		endDate: item.endDate,
		isCompact: false,
	}
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
					<div className="flex flex-col gap-1.5">
						{insight.items.map((item) => {
							const context = getRenderContext(item)

							return (
								<div
									className={cn(
										// Same anatomy as an agenda row, so the two screens read alike.
										'flex flex-col gap-0.5 rounded-xs border border-l-4 border-transparent px-3 py-2',
										getPlanItemClassName(item.plan, context),
										// A finished block steps back; the running one is the only one emphasised.
										item.state === 'past' && 'opacity-60',
									)}
									key={item.plan.id}
								>
									<PlanItemContent plan={item.plan} context={context} taskTitle={item.taskTitle} />
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
