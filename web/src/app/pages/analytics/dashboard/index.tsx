import { format } from 'date-fns'
import { useMemo } from 'react'
import { BrowserTitle } from '@/components/browser-title'
import { usePlans } from '@/features/plans/store/plans-store'
import { useTasks } from '@/features/tasks/store/tasks-store'
import { buildWorkLogContributions } from '@/features/work-logs/model/work-log-contributions'
import { useWorkLogs } from '@/features/work-logs/store/work-logs-store'
import { CapacityCard } from './components/capacity-card'
import { OverdueTasksCard } from './components/overdue-tasks-card'
import { PlannedVsLoggedCard } from './components/planned-vs-logged-card'
import { PlannedVsLoggedChart } from './components/planned-vs-logged-chart'
import { TodayPlanCard } from './components/today-plan-card'
import { UpcomingDueDatesCard } from './components/upcoming-due-dates-card'
import { WhereTimeWentCard } from './components/where-time-went-card'
import { WorkLogsContributionGraph } from './components/work-logs-contributions-graph'
import {
	buildDashboardWeeklyWork,
	buildTodayPlanInsight,
	buildWhereTimeWentInsight,
	getDashboardDeadlineMetrics,
	WEEKLY_CAPACITY_MINUTES,
} from './model/dashboard-insights'

export function DashboardPage() {
	const { tasks } = useTasks()
	const { plans } = usePlans()
	const { workLogs } = useWorkLogs()
	const deadlineMetrics = useMemo(() => getDashboardDeadlineMetrics(tasks), [tasks])
	const weeklyWork = useMemo(() => buildDashboardWeeklyWork(plans, workLogs), [plans, workLogs])
	const todayPlan = useMemo(() => buildTodayPlanInsight(plans, tasks), [plans, tasks])
	const whereTimeWent = useMemo(() => buildWhereTimeWentInsight(workLogs, tasks), [workLogs, tasks])
	const contributions = useMemo(() => buildWorkLogContributions(workLogs), [workLogs])

	return (
		<>
			<BrowserTitle title="Dashboard" />

			<div className="styled-scrollbar flex flex-col overflow-auto p-4 gap-4">
				<p className="text-base font-medium">{format(new Date(), 'EEE, MMMM dd, yyyy')}</p>

				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<OverdueTasksCard overdueCount={deadlineMetrics.overdueCount} />

					<UpcomingDueDatesCard
						dueTodayCount={deadlineMetrics.dueTodayCount}
						dueNext7DaysCount={deadlineMetrics.dueNext7DaysCount}
					/>

					<CapacityCard
						plannedMinutes={weeklyWork.plannedMinutes}
						weeklyCapacityMinutes={WEEKLY_CAPACITY_MINUTES}
					/>
					<PlannedVsLoggedCard
						loggedMinutes={weeklyWork.loggedMinutes}
						plannedMinutes={weeklyWork.plannedMinutes}
					/>
				</div>

				<div className="grid gap-4 lg:h-90 lg:grid-cols-10">
					<PlannedVsLoggedChart className="h-80 lg:col-span-6 lg:h-auto" />
					<TodayPlanCard className="h-80 lg:col-span-4 lg:h-auto" insight={todayPlan} />
				</div>

				<div className="flex flex-wrap items-stretch gap-4">
					<WorkLogsContributionGraph contributions={contributions} />
					<WhereTimeWentCard className="min-w-60 flex-[1_1_15rem]" insight={whereTimeWent} />
				</div>
			</div>
		</>
	)
}
