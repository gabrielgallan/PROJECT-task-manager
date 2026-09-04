import {
	addDays,
	addMinutes,
	eachWeekOfInterval,
	set,
	startOfDay,
	startOfYear,
	subDays,
} from 'date-fns'

export interface PrototypeWorkLog {
	id: string
	title: string
	description?: string
	startDate: string
	endDate: string
	taskId?: string | null
	categoryId?: string | null
	createdAt: string
	updatedAt: string
}

interface ISeed {
	/** Days before today. Work logs only ever exist in the past. */
	daysAgo: number
	start: [hour: number, minute: number]
	end: [hour: number, minute: number]
	title: string
	description?: string
	/** Ids from TASKS_MOCK, kept as plain strings so the modules stay independent. */
	taskId?: string
	categoryId?: string
}

/**
 * Seeds respect the no-overlap invariant and leave deliberate gaps, so the
 * untracked-time summary has something real to report.
 */
const SEEDS: ISeed[] = [
	// Today: a morning block, a gap for lunch, and the afternoon so far.
	{
		daysAgo: 0,
		start: [8, 30],
		end: [9, 0],
		title: 'Inbox & follow-ups',
	},
	{
		daysAgo: 0,
		start: [9, 0],
		end: [11, 30],
		title: 'Mapeamento de eventos',
		description: 'Event mapping and retry handling.',
		taskId: 'task-1',
		categoryId: 'category-development',
	},
	{
		daysAgo: 0,
		start: [13, 30],
		end: [15, 0],
		title: 'Treino do modelo',
		taskId: 'task-2',
		categoryId: 'category-focus',
	},
	// Yesterday: full day, one task-less block.
	{
		daysAgo: 1,
		start: [9, 0],
		end: [10, 0],
		title: 'Daily sync',
		categoryId: 'category-meetings',
	},
	{
		daysAgo: 1,
		start: [10, 0],
		end: [12, 0],
		title: 'Ajuste no parser de datas',
		taskId: 'task-3',
		categoryId: 'category-development',
	},
	{
		daysAgo: 1,
		start: [13, 0],
		end: [17, 30],
		title: 'Integração DAHUA',
		description: 'Pairing on the camera adapter.',
		taskId: 'task-1',
		categoryId: 'category-development',
	},
	// Two days ago: single long block, no gaps to report.
	{
		daysAgo: 2,
		start: [9, 30],
		end: [16, 0],
		title: 'Revisão Auto Guide',
		taskId: 'task-4',
		categoryId: 'category-review',
	},
	// Three days ago: fragmented day.
	{
		daysAgo: 3,
		start: [8, 0],
		end: [8, 30],
		title: 'Planning',
		categoryId: 'category-planning',
	},
	{
		daysAgo: 3,
		start: [8, 30],
		end: [10, 0],
		title: 'Levantamento de horas',
		taskId: 'task-5',
		categoryId: 'category-administration',
	},
	{
		daysAgo: 3,
		start: [11, 0],
		end: [12, 0],
		title: 'Code review',
		categoryId: 'category-review',
	},
	{
		daysAgo: 3,
		start: [14, 30],
		end: [18, 0],
		title: 'Migração do banco de imagens',
		taskId: 'task-6',
		categoryId: 'category-focus',
	},
	// Six days ago, so the previous week is not empty in the week view.
	{
		daysAgo: 6,
		start: [9, 0],
		end: [12, 30],
		title: 'Atualização de dependências',
		taskId: 'task-11',
		categoryId: 'category-development',
	},
	{
		daysAgo: 6,
		start: [14, 0],
		end: [16, 0],
		title: 'Escrita dos exemplos de payload',
		taskId: 'task-8',
		categoryId: 'category-administration',
	},
]

const HISTORICAL_DURATIONS = [90, 210, 330, 450] as const

const HISTORICAL_PROFILES = [
	{ title: 'Integração DAHUA', taskId: 'task-1', categoryId: 'category-development' },
	{ title: 'POC de reconhecimento de placas', taskId: 'task-2', categoryId: 'category-focus' },
	{
		title: 'Correção de fuso horário nos logs',
		taskId: 'task-3',
		categoryId: 'category-development',
	},
	{ title: 'Revisão Auto Guide', taskId: 'task-4', categoryId: 'category-review' },
	{ title: 'Relatório mensal de horas', taskId: 'task-5', categoryId: 'category-administration' },
	{ title: 'Migração do banco de imagens', taskId: 'task-6', categoryId: 'category-focus' },
	{
		title: 'Documentação da API de eventos',
		taskId: 'task-8',
		categoryId: 'category-administration',
	},
	{ title: 'Meetings and follow-ups', categoryId: 'category-meetings' },
] as const

/**
 * A light, deterministic history makes the annual contribution graph useful as
 * a visual prototype. Durations rotate through every graph level and the second
 * day on alternating weeks avoids an artificial once-a-week pattern.
 */
function buildHistoricalWorkLogs(today: Date): PrototypeWorkLog[] {
	const yearStart = startOfYear(today)
	const historyEnd = subDays(startOfDay(today), 10)

	if (historyEnd < yearStart) return []

	const weeks = eachWeekOfInterval({ start: yearStart, end: historyEnd }, { weekStartsOn: 1 })

	return weeks.flatMap((weekStart, weekIndex) => {
		const dates = [addDays(weekStart, 1 + (weekIndex % 3))]

		if (weekIndex % 2 === 0) {
			dates.push(addDays(weekStart, 4))
		}

		return dates
			.filter((date) => date >= yearStart && date <= historyEnd)
			.map((date, dayIndex) => {
				const profile = HISTORICAL_PROFILES[(weekIndex * 2 + dayIndex) % HISTORICAL_PROFILES.length]
				const duration = HISTORICAL_DURATIONS[(weekIndex + dayIndex) % HISTORICAL_DURATIONS.length]
				const startDate = set(date, {
					hours: 8 + ((weekIndex + dayIndex) % 2),
					minutes: 30,
					seconds: 0,
					milliseconds: 0,
				})
				const endDate = addMinutes(startDate, duration)

				return {
					id: `historical-work-log-${weekIndex + 1}-${dayIndex + 1}`,
					title: profile.title,
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					taskId: 'taskId' in profile ? profile.taskId : null,
					categoryId: profile.categoryId,
					createdAt: endDate.toISOString(),
					updatedAt: endDate.toISOString(),
				}
			})
	})
}

export function buildPrototypeWorkLogs(): PrototypeWorkLog[] {
	const today = new Date()

	const recentLogs = SEEDS.map((seed, index) => {
		const day = subDays(today, seed.daysAgo)
		const startDate = set(day, {
			hours: seed.start[0],
			minutes: seed.start[1],
			seconds: 0,
			milliseconds: 0,
		})
		const endDate = set(day, {
			hours: seed.end[0],
			minutes: seed.end[1],
			seconds: 0,
			milliseconds: 0,
		})

		return {
			id: `work-log-${index + 1}`,
			title: seed.title,
			description: seed.description,
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			taskId: seed.taskId ?? null,
			categoryId: seed.categoryId ?? null,
			createdAt: endDate.toISOString(),
			updatedAt: endDate.toISOString(),
		}
	}).filter((workLog) => new Date(workLog.endDate) <= today)

	return [...buildHistoricalWorkLogs(today), ...recentLogs]
}
