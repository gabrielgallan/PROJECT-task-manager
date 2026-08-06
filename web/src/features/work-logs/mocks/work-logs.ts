import { set, subDays } from 'date-fns'
import type { IWorkLog } from '@/features/work-logs/model/work-log-types'

interface ISeed {
	/** Days before today. Work logs only ever exist in the past. */
	daysAgo: number
	start: [hour: number, minute: number]
	end: [hour: number, minute: number]
	title: string
	description?: string
	/** Ids from TASKS_MOCK, kept as plain strings so the modules stay independent. */
	taskId?: string
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
	},
	{
		daysAgo: 0,
		start: [13, 30],
		end: [15, 0],
		title: 'Treino do modelo',
		taskId: 'task-2',
	},
	// Yesterday: full day, one task-less block.
	{
		daysAgo: 1,
		start: [9, 0],
		end: [10, 0],
		title: 'Daily sync',
	},
	{
		daysAgo: 1,
		start: [10, 0],
		end: [12, 0],
		title: 'Ajuste no parser de datas',
		taskId: 'task-3',
	},
	{
		daysAgo: 1,
		start: [13, 0],
		end: [17, 30],
		title: 'Integração DAHUA',
		description: 'Pairing on the camera adapter.',
		taskId: 'task-1',
	},
	// Two days ago: single long block, no gaps to report.
	{
		daysAgo: 2,
		start: [9, 30],
		end: [16, 0],
		title: 'Revisão Auto Guide',
		taskId: 'task-4',
	},
	// Three days ago: fragmented day.
	{
		daysAgo: 3,
		start: [8, 0],
		end: [8, 30],
		title: 'Planning',
	},
	{
		daysAgo: 3,
		start: [8, 30],
		end: [10, 0],
		title: 'Levantamento de horas',
		taskId: 'task-5',
	},
	{
		daysAgo: 3,
		start: [11, 0],
		end: [12, 0],
		title: 'Code review',
	},
	{
		daysAgo: 3,
		start: [14, 30],
		end: [18, 0],
		title: 'Migração do banco de imagens',
		taskId: 'task-6',
	},
	// Six days ago, so the previous week is not empty in the week view.
	{
		daysAgo: 6,
		start: [9, 0],
		end: [12, 30],
		title: 'Atualização de dependências',
		taskId: 'task-11',
	},
	{
		daysAgo: 6,
		start: [14, 0],
		end: [16, 0],
		title: 'Escrita dos exemplos de payload',
		taskId: 'task-8',
	},
]

function buildWorkLogs(): IWorkLog[] {
	const today = new Date()

	return SEEDS.map((seed, index) => {
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
			createdAt: endDate.toISOString(),
			updatedAt: endDate.toISOString(),
		}
	}).filter((workLog) => new Date(workLog.endDate) <= today)
}

export const WORK_LOGS_MOCK: IWorkLog[] = buildWorkLogs()
