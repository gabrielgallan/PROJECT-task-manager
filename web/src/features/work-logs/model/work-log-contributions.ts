import {
	differenceInMinutes,
	eachDayOfInterval,
	endOfYear,
	format,
	isAfter,
	isValid,
	parseISO,
	startOfDay,
	startOfYear,
} from 'date-fns'

import type { IWorkLog } from '@/features/work-logs/model/work-log-types'

export interface IWorkLogContribution {
	date: string
	/** Minutes logged on that day. */
	count: number
	level: number
	workLogCount: number
	isFuture: boolean
}

export const CONTRIBUTION_MAX_LEVEL = 4

export function getWorkLogContributionLevel(minutes: number) {
	if (minutes <= 0) return 0
	if (minutes <= 2 * 60) return 1
	if (minutes <= 4 * 60) return 2
	if (minutes <= 6 * 60) return 3
	return CONTRIBUTION_MAX_LEVEL
}

export function buildWorkLogContributions(
	workLogs: IWorkLog[],
	today = new Date(),
): IWorkLogContribution[] {
	const grouped = new Map<string, { minutes: number; workLogCount: number }>()
	const yearStart = startOfYear(today)
	const yearEnd = endOfYear(today)

	for (const workLog of workLogs) {
		const startDate = parseISO(workLog.startDate)
		const endDate = parseISO(workLog.endDate)

		if (
			!isValid(startDate) ||
			!isValid(endDate) ||
			startDate < yearStart ||
			startDate > today
		) {
			continue
		}

		const key = format(startDate, 'yyyy-MM-dd')
		const current = grouped.get(key) ?? { minutes: 0, workLogCount: 0 }
		current.minutes += Math.max(0, differenceInMinutes(endDate, startDate))
		current.workLogCount += 1
		grouped.set(key, current)
	}

	return eachDayOfInterval({ start: yearStart, end: yearEnd }).map((date) => {
		const key = format(date, 'yyyy-MM-dd')
		const current = grouped.get(key) ?? { minutes: 0, workLogCount: 0 }
		const isFuture = isAfter(startOfDay(date), startOfDay(today))

		return {
			date: key,
			count: isFuture ? 0 : current.minutes,
			level: isFuture ? 0 : getWorkLogContributionLevel(current.minutes),
			workLogCount: isFuture ? 0 : current.workLogCount,
			isFuture,
		}
	})
}
