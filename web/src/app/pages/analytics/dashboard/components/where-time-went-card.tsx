import { Link2Off } from 'lucide-react'
import { ListItem, ListItems, ListProvider } from '@/components/kibo-ui/list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TASK_STATUS_LABEL } from '@/features/tasks/model/task-status'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'
import { cn } from '@/lib/utils'
import type { IWhereTimeWentInsight } from '../model/dashboard-insights'

interface WhereTimeWentCardProps {
	insight: IWhereTimeWentInsight
	className?: string
}

export function WhereTimeWentCard({ insight, className }: WhereTimeWentCardProps) {
	return (
		<Card className={cn('min-h-0 [--card-spacing:--spacing(2)]', className)} size="sm">
			<CardHeader>
				<CardTitle>Where your time went</CardTitle>
			</CardHeader>

			<CardContent className="min-h-0 flex-1">
				{insight.items.length > 0 ? (
					<ListProvider>
						<ListItems className="gap-1 overflow-auto p-0">
							{insight.items.map((item, index) => {
								const statusLabel = item.status ? TASK_STATUS_LABEL[item.status] : 'Unknown status'

								return (
									<ListItem
										className="min-w-0 border-border/70 p-2 shadow-none"
										draggable={false}
										id={item.taskId}
										index={index}
										key={item.taskId}
										name={item.title}
										parent="where-time-went"
									>
										<Tooltip>
											<TooltipTrigger
												render={
													<span className="flex min-w-0 flex-1 items-center gap-2">
														<span
															aria-label={statusLabel}
															className={cn(
																'size-1.5 shrink-0 rounded-full',
																item.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500',
															)}
															role="img"
														/>
														<span className="min-w-0 flex-1 truncate text-xs leading-4 font-medium">
															{item.title}
														</span>
														<span className="shrink-0 text-[10px] leading-4 text-muted-foreground">
															{item.workLogCount} {item.workLogCount === 1 ? 'log' : 'logs'} ·{' '}
															{Math.round(item.share * 100)}%
														</span>
													</span>
												}
											/>
											<TooltipContent>{item.title}</TooltipContent>
										</Tooltip>

										<span className="shrink-0 text-sm font-medium tabular-nums">
											{formatMinutes(item.minutes)}
										</span>
									</ListItem>
								)
							})}
						</ListItems>
					</ListProvider>
				) : (
					<div className="flex h-full min-h-28 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
						<Link2Off className="size-5" />
						<p className="max-w-52 text-xs">
							{insight.totalMinutes > 0
								? 'No task-linked work has been logged yet.'
								: 'Log some work to see your most worked Tasks.'}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
