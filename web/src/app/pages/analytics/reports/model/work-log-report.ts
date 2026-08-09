import {
	differenceInMinutes,
	endOfDay,
	endOfMonth,
	format,
	isAfter,
	isWithinInterval,
	parseISO,
	startOfDay,
	startOfMonth,
} from 'date-fns'
import type { DateRange } from 'react-day-picker'

import type { Task } from '@/features/tasks/model/task-types'
import type { IWorkLog } from '@/features/work-logs/model/work-log-types'

export type TWorkLogReportGroup = 'day' | 'task' | 'none'

export type TWorkLogReportColumn =
	| 'date'
	| 'start'
	| 'end'
	| 'duration'
	| 'task'
	| 'title'
	| 'description'

export interface IWorkLogReportConfig {
	range: DateRange | undefined
	taskIds: string[]
	groupBy: TWorkLogReportGroup
	columns: TWorkLogReportColumn[]
}

export interface IWorkLogReportRow {
	workLog: IWorkLog
	startDate: Date
	endDate: Date
	durationMinutes: number
	taskLabel: string
}

export interface IWorkLogReportGroup {
	key: string
	label: string
	rows: IWorkLogReportRow[]
	totalMinutes: number
}

export interface IWorkLogReportSummary {
	totalMinutes: number
	workLogCount: number
	activeDayCount: number
	taskCount: number
	unassignedMinutes: number
}

export interface IWorkLogReportResult {
	rows: IWorkLogReportRow[]
	groups: IWorkLogReportGroup[]
	summary: IWorkLogReportSummary
}

export const NO_TASK_REPORT_FILTER = 'no-task'

export const WORK_LOG_REPORT_COLUMNS: ReadonlyArray<{
	value: TWorkLogReportColumn
	label: string
}> = [
	{ value: 'date', label: 'Date' },
	{ value: 'start', label: 'Start' },
	{ value: 'end', label: 'End' },
	{ value: 'duration', label: 'Duration' },
	{ value: 'task', label: 'Task' },
	{ value: 'title', label: 'Title' },
	{ value: 'description', label: 'Description' },
]

export const DEFAULT_WORK_LOG_REPORT_COLUMNS: TWorkLogReportColumn[] = [
	'date',
	'start',
	'end',
	'duration',
	'task',
	'title',
]

export function createDefaultWorkLogReportConfig(
	today = new Date(),
): IWorkLogReportConfig {
	return {
		range: {
			from: startOfMonth(today),
			to: endOfMonth(today),
		},
		taskIds: [],
		groupBy: 'day',
		columns: [...DEFAULT_WORK_LOG_REPORT_COLUMNS],
	}
}

export function isCompleteDateRange(
	range: DateRange | undefined,
): range is { from: Date; to: Date } {
	return Boolean(range?.from && range.to && !isAfter(range.from, range.to))
}

function getDurationMinutes(startDate: Date, endDate: Date) {
	return Math.max(0, differenceInMinutes(endDate, startDate))
}

function getTaskLabel(taskId: string | null | undefined, taskMap: Map<string, Task>) {
	if (!taskId) return 'No task'
	return taskMap.get(taskId)?.title ?? 'Unknown task'
}

function buildGroups(
	rows: IWorkLogReportRow[],
	groupBy: TWorkLogReportGroup,
): IWorkLogReportGroup[] {
	if (groupBy === 'none') {
		return [
			{
				key: 'all',
				label: 'All work logs',
				rows,
				totalMinutes: rows.reduce((total, row) => total + row.durationMinutes, 0),
			},
		]
	}

	const groups = new Map<string, IWorkLogReportGroup>()

	for (const row of rows) {
		const isDayGroup = groupBy === 'day'
		const key = isDayGroup
			? format(row.startDate, 'yyyy-MM-dd')
			: row.workLog.taskId
				? `task:${row.workLog.taskId}`
				: NO_TASK_REPORT_FILTER
		const label = isDayGroup
			? format(row.startDate, 'EEEE, MMMM d, yyyy')
			: row.taskLabel
		const existing = groups.get(key)

		if (existing) {
			existing.rows.push(row)
			existing.totalMinutes += row.durationMinutes
		} else {
			groups.set(key, {
				key,
				label,
				rows: [row],
				totalMinutes: row.durationMinutes,
			})
		}
	}

	const result = Array.from(groups.values())

	if (groupBy === 'task') {
		result.sort((a, b) => a.label.localeCompare(b.label))
	}

	return result
}

export function buildWorkLogReport(
	workLogs: IWorkLog[],
	tasks: Task[],
	config: IWorkLogReportConfig,
): IWorkLogReportResult {
	if (!isCompleteDateRange(config.range)) {
		return {
			rows: [],
			groups: [],
			summary: {
				totalMinutes: 0,
				workLogCount: 0,
				activeDayCount: 0,
				taskCount: 0,
				unassignedMinutes: 0,
			},
		}
	}

	const taskMap = new Map(tasks.map((task) => [task.id, task]))
	const interval = {
		start: startOfDay(config.range.from),
		end: endOfDay(config.range.to),
	}

	const rows = workLogs
		.filter((workLog) => {
			const startDate = parseISO(workLog.startDate)

			if (!isWithinInterval(startDate, interval)) return false
			if (config.taskIds.length === 0) return true

			const taskFilterValue = workLog.taskId ?? NO_TASK_REPORT_FILTER
			return config.taskIds.includes(taskFilterValue)
		})
		.map<IWorkLogReportRow>((workLog) => {
			const startDate = parseISO(workLog.startDate)
			const endDate = parseISO(workLog.endDate)

			return {
				workLog,
				startDate,
				endDate,
				durationMinutes: getDurationMinutes(startDate, endDate),
				taskLabel: getTaskLabel(workLog.taskId, taskMap),
			}
		})
		.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

	const activeDays = new Set(rows.map((row) => format(row.startDate, 'yyyy-MM-dd')))
	const taskIds = new Set(
		rows.flatMap((row) => (row.workLog.taskId ? [row.workLog.taskId] : [])),
	)

	const summary = rows.reduce<IWorkLogReportSummary>(
		(totals, row) => ({
			...totals,
			totalMinutes: totals.totalMinutes + row.durationMinutes,
			workLogCount: totals.workLogCount + 1,
			unassignedMinutes:
				totals.unassignedMinutes + (row.workLog.taskId ? 0 : row.durationMinutes),
		}),
		{
			totalMinutes: 0,
			workLogCount: 0,
			activeDayCount: activeDays.size,
			taskCount: taskIds.size,
			unassignedMinutes: 0,
		},
	)

	return {
		rows,
		groups: buildGroups(rows, config.groupBy),
		summary,
	}
}
