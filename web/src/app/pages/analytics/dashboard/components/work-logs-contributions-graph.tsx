import {
	ContributionGraph,
	ContributionGraphBlock,
	ContributionGraphCalendar,
	ContributionGraphFooter,
	ContributionGraphLegend,
	ContributionGraphTotalCount,
} from '@/components/kibo-ui/contribution-graph'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	CONTRIBUTION_MAX_LEVEL,
	WORK_LOG_CONTRIBUTIONS_MOCK,
} from '@/features/work-logs/mocks/contributions'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'
import { cn } from '@/lib/utils'

/** One hue, light to dark. Level 0 is an empty day, not the first step. */
const LEVEL_FILL = cn(
	'data-[level="0"]:fill-[var(--contribution-0)]',
	'data-[level="1"]:fill-[var(--contribution-1)]',
	'data-[level="2"]:fill-[var(--contribution-2)]',
	'data-[level="3"]:fill-[var(--contribution-3)]',
	'data-[level="4"]:fill-[var(--contribution-4)]',
)

interface IWorkLogsContributionGraphProps {
	className?: string
}

export function WorkLogsContributionGraph({ className }: IWorkLogsContributionGraphProps) {
	const totalMinutes = WORK_LOG_CONTRIBUTIONS_MOCK.reduce((sum, day) => sum + day.count, 0)
	// The graph sums `count`, which here is minutes, so the footer gets days instead.
	const activeDays = WORK_LOG_CONTRIBUTIONS_MOCK.filter((day) => day.count > 0).length

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Logged work</CardTitle>
				<CardDescription>{formatMinutes(totalMinutes)} recorded this year</CardDescription>
			</CardHeader>

			<CardContent>
				<ContributionGraph
					blockMargin={4}
					blockSize={8}
					data={WORK_LOG_CONTRIBUTIONS_MOCK}
					maxLevel={CONTRIBUTION_MAX_LEVEL}
					totalCount={activeDays}
				>
					<ContributionGraphCalendar>
						{({ activity, dayIndex, weekIndex }) => (
							<ContributionGraphBlock
								activity={activity}
								className={LEVEL_FILL}
								dayIndex={dayIndex}
								weekIndex={weekIndex}
							>
								<title>
									{activity.count > 0
										? `${formatMinutes(activity.count)} on ${activity.date}`
										: `No work logged on ${activity.date}`}
								</title>
							</ContributionGraphBlock>
						)}
					</ContributionGraphCalendar>

					<ContributionGraphFooter className="items-center pt-2 text-xs">
						<ContributionGraphTotalCount>
							{({ totalCount }) => (
								<span className="text-muted-foreground">
									{totalCount} days with recorded work
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
