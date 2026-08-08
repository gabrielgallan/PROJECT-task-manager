import { differenceInMinutes, isSameDay, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { usePlans } from '@/features/plans/store/plans-store'
import { useWorkLogs } from '@/features/work-logs/store/work-logs-store'

/**
 * What a task's schedule looks like once the two modules are flattened: an
 * intention and a record read the same way here, and only the kind tells them
 * apart. The sheet consumes this and never learns that plans or work logs exist.
 */
export interface ITaskActivityEntry {
	id: string
	kind: TTaskActivityKind
	title: string
	startDate: Date
	endDate: Date
	/** Plans only: the moment the plan was recorded as work actually done. */
	isConfirmed?: boolean
}

export type TTaskActivityKind = 'plan' | 'work-log'

export interface ITaskActivityDay {
	date: Date
	entries: ITaskActivityEntry[]
}

export function getEntryMinutes(entry: ITaskActivityEntry): number {
	return Math.max(0, differenceInMinutes(entry.endDate, entry.startDate))
}

export function sumEntryMinutes(entries: ITaskActivityEntry[], kind: TTaskActivityKind): number {
	return entries
		.filter((entry) => entry.kind === kind)
		.reduce((total, entry) => total + getEntryMinutes(entry), 0)
}

/** Days keep the order they are given, so the caller decides the reading. */
export function groupEntriesByDay(entries: ITaskActivityEntry[]): ITaskActivityDay[] {
	return entries.reduce<ITaskActivityDay[]>((days, entry) => {
		const current = days.at(-1)

		if (current && isSameDay(current.date, entry.startDate)) {
			current.entries.push(entry)
		} else {
			days.push({ date: entry.startDate, entries: [entry] })
		}

		return days
	}, [])
}

/**
 * The one place that knows both modules. It lives with the page, not with a
 * feature, so plans and work logs stay unaware of each other.
 */
export function useTaskActivity(taskId: string | undefined): ITaskActivityEntry[] {
	const { plans } = usePlans()
	const { workLogs } = useWorkLogs()

	return useMemo(() => {
		if (!taskId) {
			return []
		}

		const entries: ITaskActivityEntry[] = [
			...plans
				.filter((plan) => plan.taskId === taskId)
				.map((plan) => ({
					id: plan.id,
					kind: 'plan' as const,
					title: plan.title,
					startDate: parseISO(plan.startDate),
					endDate: parseISO(plan.endDate),
					isConfirmed: !!plan.confirmedAt,
				})),
			...workLogs
				.filter((workLog) => workLog.taskId === taskId)
				.map((workLog) => ({
					id: workLog.id,
					kind: 'work-log' as const,
					title: workLog.title,
					startDate: parseISO(workLog.startDate),
					endDate: parseISO(workLog.endDate),
				})),
		]

		// Newest first: what is coming up leads, and recent work follows.
		return entries.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
	}, [plans, workLogs, taskId])
}
