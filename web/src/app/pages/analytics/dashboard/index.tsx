import { BrowserTitle } from '@/components/browser-title'
import { CapacityCard } from './components/capacity-card'
import { OverdueTasksCard } from './components/overdue-tasks-card'
import { PlannedVsLoggedCard } from './components/planned-vs-logged-card'
import { PlannedVsLoggedChart } from './components/planned-vs-logged-chart'
import { TasksByStatusChart } from './components/tasks-by-status-chart'
import { TimeByTaskCard } from './components/time-by-task-card'
import { UpcomingDueDatesCard } from './components/upcoming-due-dates-card'
import { WorkLogsContributionGraph } from './components/work-logs-contributions-graph'

export function DashboardPage() {
	return (
		<>
			<BrowserTitle title="Dashboard" />

			<div className="styled-scrollbar flex flex-col overflow-auto p-4 gap-4">
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<OverdueTasksCard overdueCount={7} overdueForMoreThan7DaysCount={3} />
					<UpcomingDueDatesCard dueTodayCount={10} dueNext7DaysCount={20} />
					<CapacityCard plannedMinutes={2200} weeklyCapacityMinutes={2400} />
					<PlannedVsLoggedCard loggedMinutes={400} plannedMinutes={600} />
				</div>

				<div className="grid h-90 gap-4 lg:grid-cols-9">
					<PlannedVsLoggedChart className="lg:col-span-5" />
					<TasksByStatusChart className="lg:col-span-4" />
				</div>

				<div className="grid gap-4 xl:grid-cols-3">
					<WorkLogsContributionGraph className="xl:col-span-2" />
					<TimeByTaskCard />
				</div>
			</div>
		</>
	)
}
