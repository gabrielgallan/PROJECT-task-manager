import { eachDayOfInterval, endOfYear, formatISO, isWeekend, startOfYear } from 'date-fns'

export interface IWorkLogContribution {
	date: string
	/** Minutes logged on that day. */
	count: number
	level: number
	workLogCount: number
	isFuture: boolean
}

export const CONTRIBUTION_MAX_LEVEL = 4

/** A full working day, used as the top of the scale. */
const FULL_DAY_MINUTES = 8 * 60

/** Deterministic, so the graph does not change on every reload while we tune it. */
function pseudoRandom(seed: number) {
	const value = Math.sin(seed * 12.9898) * 43758.5453

	return value - Math.floor(value)
}

function buildContributions(): IWorkLogContribution[] {
	const today = new Date()

	return eachDayOfInterval({
		start: startOfYear(today),
		end: endOfYear(today),
	}).map((date, index) => {
		const noise = pseudoRandom(index + 1)
		// Nothing is logged ahead of time, and weekends are mostly quiet.
		const isFuture = date > today
		const idleChance = isWeekend(date) ? 0.75 : 0.15
		const minutes = isFuture || noise < idleChance ? 0 : Math.round(noise * FULL_DAY_MINUTES)
		const maxPlausibleLogs = Math.min(5, Math.max(1, Math.ceil(minutes / 90)))
		const workLogCount =
			minutes === 0 ? 0 : 1 + Math.floor(pseudoRandom(index + 401) * maxPlausibleLogs)

		return {
			date: formatISO(date, { representation: 'date' }),
			count: minutes,
			level: Math.ceil((Math.min(minutes, FULL_DAY_MINUTES) / FULL_DAY_MINUTES) * CONTRIBUTION_MAX_LEVEL),
			workLogCount,
			isFuture,
		}
	})
}

export const WORK_LOG_CONTRIBUTIONS_MOCK: IWorkLogContribution[] = buildContributions()
