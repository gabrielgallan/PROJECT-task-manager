import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { BrowserTitle } from '@/components/browser-title'
import { useTasks } from '@/features/tasks/store/tasks-store'
import { useWorkLogs } from '@/features/work-logs/store/work-logs-store'

import { WorkLogReportPreview } from './components/work-log-report-preview'
import { WorkLogReportSummary } from './components/work-log-report-summary'
import {
	type TReportExportFormat,
	WorkLogReportToolbar,
} from './components/work-log-report-toolbar'
import {
	buildWorkLogReport,
	createDefaultWorkLogReportConfig,
	DEFAULT_WORK_LOG_REPORT_COLUMNS,
	isCompleteDateRange,
	type IWorkLogReportConfig,
	type TWorkLogReportColumn,
	WORK_LOG_REPORT_COLUMNS,
} from './model/work-log-report'

function rangesMatch(
	left: IWorkLogReportConfig['range'],
	right: IWorkLogReportConfig['range'],
) {
	return (
		left?.from?.getTime() === right?.from?.getTime() &&
		left?.to?.getTime() === right?.to?.getTime()
	)
}

function configsMatch(left: IWorkLogReportConfig, right: IWorkLogReportConfig) {
	return (
		rangesMatch(left.range, right.range) &&
		left.groupBy === right.groupBy &&
		left.taskIds.length === right.taskIds.length &&
		left.taskIds.every((taskId) => right.taskIds.includes(taskId)) &&
		left.columns.length === right.columns.length &&
		left.columns.every((column, index) => column === right.columns[index])
	)
}

export function ReportsPage() {
	const { workLogs } = useWorkLogs()
	const { tasks } = useTasks()
	const defaultConfig = useMemo(() => createDefaultWorkLogReportConfig(), [])
	const [config, setConfig] = useState<IWorkLogReportConfig>(() => ({
		...defaultConfig,
		taskIds: [...defaultConfig.taskIds],
		columns: [...defaultConfig.columns],
	}))

	const report = useMemo(
		() => buildWorkLogReport(workLogs, tasks, config),
		[workLogs, tasks, config],
	)

	const isRangeComplete = isCompleteDateRange(config.range)
	const canReset = !configsMatch(config, defaultConfig)

	function toggleTask(taskId: string) {
		setConfig((current) => ({
			...current,
			taskIds: current.taskIds.includes(taskId)
				? current.taskIds.filter((value) => value !== taskId)
				: [...current.taskIds, taskId],
		}))
	}

	function toggleColumn(column: TWorkLogReportColumn) {
		setConfig((current) => {
			const isSelected = current.columns.includes(column)

			if (isSelected && current.columns.length === 1) return current

			const selected = isSelected
				? current.columns.filter((value) => value !== column)
				: [...current.columns, column]
			const columns = WORK_LOG_REPORT_COLUMNS.map((option) => option.value).filter((value) =>
				selected.includes(value),
			)

			return { ...current, columns }
		})
	}

	function resetReport() {
		setConfig({
			...defaultConfig,
			taskIds: [...defaultConfig.taskIds],
			columns: [...defaultConfig.columns],
		})
	}

	function clearFilters() {
		setConfig((current) => ({
			...current,
			range: defaultConfig.range,
			taskIds: [],
		}))
	}

	function simulateExport(format: TReportExportFormat) {
		const isExcel = format === 'xlsx'
		toast.success(`${isExcel ? 'Excel' : 'CSV'} export simulated`, {
			description: `${report.rows.length} ${
				report.rows.length === 1 ? 'Work Log' : 'Work Logs'
			} would be exported as .${format}.`,
		})
	}

	return (
		<>
			<BrowserTitle title="Reports" />

			<div className="flex min-h-0 flex-1 flex-col">
				<WorkLogReportToolbar
					range={config.range}
					tasks={tasks}
					selectedTaskIds={config.taskIds}
					groupBy={config.groupBy}
					selectedColumns={config.columns}
					canReset={canReset}
					exportDisabled={!isRangeComplete || report.rows.length === 0}
					onRangeChange={(range) => setConfig((current) => ({ ...current, range }))}
					onToggleTask={toggleTask}
					onClearTasks={() =>
						setConfig((current) => ({ ...current, taskIds: [] }))
					}
					onGroupChange={(groupBy) =>
						setConfig((current) => ({ ...current, groupBy }))
					}
					onToggleColumn={toggleColumn}
					onSelectAllColumns={() =>
						setConfig((current) => ({
							...current,
							columns: WORK_LOG_REPORT_COLUMNS.map((column) => column.value),
						}))
					}
					onResetColumns={() =>
						setConfig((current) => ({
							...current,
							columns: [...DEFAULT_WORK_LOG_REPORT_COLUMNS],
						}))
					}
					onReset={resetReport}
					onExport={simulateExport}
				/>

				<div className="styled-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
					<WorkLogReportSummary summary={report.summary} />
					<WorkLogReportPreview
						report={report}
						columns={config.columns}
						groupBy={config.groupBy}
						isRangeComplete={isRangeComplete}
						allWorkLogCount={workLogs.length}
						onClearFilters={clearFilters}
					/>
				</div>
			</div>
		</>
	)
}
