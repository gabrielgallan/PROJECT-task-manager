import { WorkLogsCalendar } from '@/app/pages/registers/work-logs/components/work-logs-calendar'
import { BrowserTitle } from '@/components/browser-title'
import { TASKS_MOCK } from '@/features/tasks/mocks/tasks'
import { useWorkLogs } from '@/features/work-logs/store/work-logs-store'

export function WorkLogsPage() {
	const { workLogs, addWorkLog, updateWorkLog, removeWorkLog } = useWorkLogs()

	return (
		<>
			<BrowserTitle title="Work logs" />

			<div className="flex min-h-0 flex-1 flex-col">
				<WorkLogsCalendar
					workLogs={workLogs}
					tasks={TASKS_MOCK}
					onCreate={addWorkLog}
					onUpdate={updateWorkLog}
					onDelete={removeWorkLog}
				/>
			</div>
		</>
	)
}
