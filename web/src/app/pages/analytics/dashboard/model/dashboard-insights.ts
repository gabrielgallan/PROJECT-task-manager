import {
	addDays,
	differenceInMinutes,
	eachDayOfInterval,
	endOfDay,
	endOfWeek,
	format,
	isBefore,
	isSameDay,
	isValid,
	parseISO,
	startOfDay,
	startOfWeek,
	startOfYear,
	subDays,
} from 'date-fns'

import { WEEK_STARTS_ON } from '@/features/calendar/constants'
import type { PrototypePlan } from '@/features/plans/mocks/plans'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'
import type { IWorkLog } from '@/features/work-logs/model/work-log-types'

export const WEEKLY_CAPACITY_MINUTES = 40 * 60

export interface IDashboardDeadlineMetrics {
	overdueCount: number
	overdueForMoreThan7DaysCount: number
	dueTodayCount: number
	dueNext7DaysCount: number
}

export interface IDashboardDailyWork {
	date: string
	plannedMinutes: number
	loggedMinutes: number
}

export interface IDashboardWeeklyWork {
	startDate: Date
	endDate: Date
	plannedMinutes: number
	loggedMinutes: number
	days: IDashboardDailyWork[]
}

export type TTodayPlanState = 'recorded' | 'now' | 'upcoming' | 'past'

export interface ITodayPlanItem {
	plan: PrototypePlan
	startDate: Date
	endDate: Date
	durationMinutes: number
	taskTitle?: string
	state: TTodayPlanState
}

export interface ITodayPlanInsight {
	items: ITodayPlanItem[]
	totalMinutes: number
}

export interface ITaskWorkShare {
	taskId: string
	title: string
	status?: TaskStatus
	minutes: number
	workLogCount: number
	share: number
}

export interface IWhereTimeWentInsight {
	year: number
	items: ITaskWorkShare[]
	totalMinutes: number
	shownMinutes: number
	shownShare: number
	unassignedMinutes: number
	otherTaskMinutes: number
}

function getIntervalMinutes(startDate: Date, endDate: Date) {
	return Math.max(0, differenceInMinutes(endDate, startDate))
}

function getItemMinutes(item: Pick<PrototypePlan | IWorkLog, 'startDate' | 'endDate'>) {
	const startDate = parseISO(item.startDate)
	const endDate = parseISO(item.endDate)

	if (!isValid(startDate) || !isValid(endDate)) return 0
	return getIntervalMinutes(startDate, endDate)
}

export function getDashboardDeadlineMetrics(
	tasks: Task[],
	today = new Date(),
): IDashboardDeadlineMetrics {
	const dayStart = startOfDay(today)
	const overdueThreshold = subDays(dayStart, 7)
	const nextWeekStart = startOfDay(addDays(dayStart, 1))
	const nextWeekEnd = endOfDay(addDays(dayStart, 7))
	const activeTasks = tasks.filter((task) => task.status !== 'DONE' && task.dueDate)
	const overdueTasks = activeTasks.filter((task) =>
		isBefore(startOfDay(task.dueDate as Date), dayStart),
	)

	return {
		overdueCount: overdueTasks.length,
		overdueForMoreThan7DaysCount: overdueTasks.filter((task) =>
			isBefore(startOfDay(task.dueDate as Date), overdueThreshold),
		).length,
		dueTodayCount: activeTasks.filter((task) => isSameDay(task.dueDate as Date, dayStart)).length,
		dueNext7DaysCount: activeTasks.filter((task) => {
			const dueDate = task.dueDate as Date
			return dueDate >= nextWeekStart && dueDate <= nextWeekEnd
		}).length,
	}
}

export function buildDashboardWeeklyWork(
	plans: PrototypePlan[],
	workLogs: IWorkLog[],
	today = new Date(),
): IDashboardWeeklyWork {
	const startDate = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
	const endDate = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
	const daily = new Map<string, IDashboardDailyWork>()

	for (const date of eachDayOfInterval({ start: startDate, end: endDate })) {
		const key = format(date, 'yyyy-MM-dd')
		daily.set(key, { date: key, plannedMinutes: 0, loggedMinutes: 0 })
	}

	for (const plan of plans) {
		const planStart = parseISO(plan.startDate)
		if (!isValid(planStart) || planStart < startDate || planStart > endDate) continue

		const day = daily.get(format(planStart, 'yyyy-MM-dd'))
		if (day) day.plannedMinutes += getItemMinutes(plan)
	}

	for (const workLog of workLogs) {
		const workLogStart = parseISO(workLog.startDate)
		if (!isValid(workLogStart) || workLogStart < startDate || workLogStart > endDate) continue

		const day = daily.get(format(workLogStart, 'yyyy-MM-dd'))
		if (day) day.loggedMinutes += getItemMinutes(workLog)
	}

	const days = Array.from(daily.values())

	return {
		startDate,
		endDate,
		plannedMinutes: days.reduce((total, day) => total + day.plannedMinutes, 0),
		loggedMinutes: days.reduce((total, day) => total + day.loggedMinutes, 0),
		days,
	}
}

function getTodayPlanState(
	plan: PrototypePlan,
	startDate: Date,
	endDate: Date,
	now: Date,
): TTodayPlanState {
	if (plan.confirmedAt) return 'recorded'
	if (now >= startDate && now < endDate) return 'now'
	if (endDate <= now) return 'past'
	return 'upcoming'
}

export function buildTodayPlanInsight(
	plans: PrototypePlan[],
	tasks: Task[],
	now = new Date(),
): ITodayPlanInsight {
	const taskMap = new Map(tasks.map((task) => [task.id, task]))
	const items = plans
		.map<ITodayPlanItem | null>((plan) => {
			const startDate = parseISO(plan.startDate)
			const endDate = parseISO(plan.endDate)

			if (!isValid(startDate) || !isValid(endDate) || !isSameDay(startDate, now)) {
				return null
			}

			return {
				plan,
				startDate,
				endDate,
				durationMinutes: getIntervalMinutes(startDate, endDate),
				taskTitle: plan.taskId ? (taskMap.get(plan.taskId)?.title ?? 'Unknown task') : undefined,
				state: getTodayPlanState(plan, startDate, endDate, now),
			}
		})
		.filter((item): item is ITodayPlanItem => item !== null)
		.sort((left, right) => left.startDate.getTime() - right.startDate.getTime())

	return {
		items,
		totalMinutes: items.reduce((total, item) => total + item.durationMinutes, 0),
	}
}

export function buildWhereTimeWentInsight(
	workLogs: IWorkLog[],
	tasks: Task[],
	today = new Date(),
	limit = 4,
): IWhereTimeWentInsight {
	const startDate = startOfYear(today)
	const taskMap = new Map(tasks.map((task) => [task.id, task]))
	const grouped = new Map<string, Omit<ITaskWorkShare, 'share'>>()
	let totalMinutes = 0
	let unassignedMinutes = 0

	for (const workLog of workLogs) {
		const workLogStart = parseISO(workLog.startDate)
		if (!isValid(workLogStart) || workLogStart < startDate || workLogStart > today) continue

		const minutes = getItemMinutes(workLog)
		totalMinutes += minutes

		if (!workLog.taskId) {
			unassignedMinutes += minutes
			continue
		}

		const task = taskMap.get(workLog.taskId)
		if (!task) continue

		const current = grouped.get(workLog.taskId)

		if (current) {
			current.minutes += minutes
			current.workLogCount += 1
		} else {
			grouped.set(workLog.taskId, {
				taskId: workLog.taskId,
				title: task.title,
				status: task.status,
				minutes,
				workLogCount: 1,
			})
		}
	}

	const allTaskItems = Array.from(grouped.values())
		.sort((left, right) => right.minutes - left.minutes || left.title.localeCompare(right.title))
		.map<ITaskWorkShare>((item) => ({
			...item,
			share: totalMinutes > 0 ? item.minutes / totalMinutes : 0,
		}))
	const items = allTaskItems.slice(0, limit)
	const shownMinutes = items.reduce((total, item) => total + item.minutes, 0)

	return {
		year: today.getFullYear(),
		items,
		totalMinutes,
		shownMinutes,
		shownShare: totalMinutes > 0 ? shownMinutes / totalMinutes : 0,
		unassignedMinutes,
		otherTaskMinutes: Math.max(0, totalMinutes - unassignedMinutes - shownMinutes),
	}
}
