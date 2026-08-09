import { format, isToday, parseISO } from 'date-fns'
import {
	ContributionGraph,
	ContributionGraphBlock,
	ContributionGraphCalendar,
	ContributionGraphFooter,
	ContributionGraphLegend,
	ContributionGraphTotalCount,
} from '@/components/kibo-ui/contribution-graph'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
	CONTRIBUTION_MAX_LEVEL,
	type IWorkLogContribution,
} from '@/features/work-logs/model/work-log-contributions'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'
import { cn } from '@/lib/utils'

/** One hue, light to dark. Level 0 is an empty day, not the first step. */
const LEVEL_FILL = cn(
	'data-[level="0"]:fill-[var(--contribution-0)]',
	'data-[level="1"]:fill-[var(--contribution-1)]',
	'data-[level="2"]:fill-[var(--contribution-2)]',
	'data-[level="3"]:fill-[var(--contribution-3)]',
	'data-[level="4"]:fill-[var(--contribution-4)]',
	'data-[future=true]:!fill-[var(--contribution-future)]',
	'data-[future=true]:stroke-border/60 data-[future=true]:stroke-[1px]',
)

function getWorkLogCountLabel(count: number) {
	return `${count} work ${count === 1 ? 'log' : 'logs'}`
}

function getContributionSummary(activity: IWorkLogContribution) {
	if (activity.isFuture) return 'Future date'
	if (activity.count === 0) return 'No work logged'

	return `${formatMinutes(activity.count)} logged${isToday(parseISO(activity.date)) ? ' so far' : ''}`
}

function getAccessibleLabel(activity: IWorkLogContribution) {
	const date = format(parseISO(activity.date), 'MMMM d, yyyy')

	if (activity.isFuture) return `Future date: ${date}`
	if (activity.count === 0) return `No work logged on ${date}`

	return `${getContributionSummary(activity)} across ${getWorkLogCountLabel(activity.workLogCount)} on ${date}`
}

interface IWorkLogsContributionGraphProps {
	contributions: IWorkLogContribution[]
	className?: string
}

export function WorkLogsContributionGraph({
	contributions,
	className,
}: IWorkLogsContributionGraphProps) {
	const totalMinutes = contributions.reduce((sum, day) => sum + day.count, 0)
	// The graph sums `count`, which here is minutes, so the footer gets days instead.
	const activeDays = contributions.filter((day) => day.count > 0).length

	return (
		<Card className={cn('w-fit max-w-full shrink-0', className)}>
			<CardHeader>
				<CardTitle>Logged work</CardTitle>
			</CardHeader>

			<CardContent>
				<ContributionGraph
					blockMargin={4}
					blockSize={10}
					fontSize={10}
					data={contributions}
					maxLevel={CONTRIBUTION_MAX_LEVEL}
					totalCount={activeDays}
				>
					<ContributionGraphCalendar>
						{({ activity, dayIndex, weekIndex }) => {
							const contribution = activity as IWorkLogContribution

							return (
								<Tooltip>
									<TooltipTrigger
										render={
											<ContributionGraphBlock
												activity={activity}
												className={LEVEL_FILL}
												data-future={contribution.isFuture}
												dayIndex={dayIndex}
												tabIndex={-1}
												weekIndex={weekIndex}
											>
												<title>{getAccessibleLabel(contribution)}</title>
											</ContributionGraphBlock>
										}
									/>

									<TooltipContent className="flex-col items-start gap-0.5">
										<span className="font-medium">
											{format(parseISO(contribution.date), 'EEEE, MMMM d')}
										</span>
										<span className="text-background/80">
											{getContributionSummary(contribution)}
										</span>
										{!contribution.isFuture && contribution.count > 0 && (
											<span className="text-background/80">
												{getWorkLogCountLabel(contribution.workLogCount)}
											</span>
										)}
									</TooltipContent>
								</Tooltip>
							)
						}}
					</ContributionGraphCalendar>

					<ContributionGraphFooter className="items-center pt-2 text-xs">
						<ContributionGraphTotalCount>
							{({ totalCount }) => (
								<span className="text-muted-foreground">
									{totalCount} active days · {formatMinutes(totalMinutes)} logged
								</span>
							)}
						</ContributionGraphTotalCount>

						<ContributionGraphLegend>
							{({ level }) => (
								<svg height={8} width={8}>
									<title>{`Level ${level}`}</title>
									<rect
										className={LEVEL_FILL}
										data-level={level}
										height={8}
										rx={2}
										ry={2}
										width={8}
									/>
								</svg>
							)}
						</ContributionGraphLegend>
					</ContributionGraphFooter>
				</ContributionGraph>
			</CardContent>
		</Card>
	)
}
