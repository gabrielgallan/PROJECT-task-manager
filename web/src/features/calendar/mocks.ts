import { addDays, set, startOfWeek } from 'date-fns'
import { WEEK_STARTS_ON } from '@/features/calendar/constants'
import type { IPlan } from '@/features/calendar/interfaces'
import type { TPlanColor } from '@/features/calendar/types'

/**
 * Static seed data. Deterministic on purpose — the layout should look the same on
 * every reload so visual regressions are obvious.
 *
 * Anchored to the current week so the calendar always opens with content.
 */

interface ISeed {
	/** Day offset from the start of the current week (0 = Monday). */
	day: number
	start: [hour: number, minute: number]
	end: [hour: number, minute: number]
	title: string
	description?: string
	color: TPlanColor
	taskId?: string
}

const SEEDS: ISeed[] = [
	// Monday
	{
		day: 0,
		start: [9, 0],
		end: [9, 30],
		title: 'Weekly planning',
		description: 'Review the backlog and set the focus for the week.',
		color: 'purple',
	},
	{
		day: 0,
		start: [10, 0],
		end: [12, 0],
		title: 'Checkout refactor',
		description: 'Extract the payment step into its own module.',
		color: 'blue',
		taskId: 'task-1',
	},
	{ day: 0, start: [14, 0], end: [15, 30], title: 'Code review', color: 'green' },
	{ day: 0, start: [16, 0], end: [17, 0], title: 'Bug triage', color: 'red', taskId: 'task-4' },

	// Tuesday
	{
		day: 1,
		start: [9, 30],
		end: [11, 30],
		title: 'Checkout refactor',
		color: 'blue',
		taskId: 'task-1',
	},
	{ day: 1, start: [11, 30], end: [12, 0], title: 'Daily sync', color: 'orange' },
	{
		day: 1,
		start: [14, 0],
		end: [16, 0],
		title: 'Reports API',
		description: 'Aggregation endpoints for the dashboard.',
		color: 'blue',
		taskId: 'task-2',
	},
	{ day: 1, start: [16, 0], end: [16, 30], title: 'Deploy window', color: 'yellow' },

	// Wednesday — overlapping blocks to exercise the layout algorithm
	{ day: 2, start: [9, 0], end: [10, 30], title: 'Architecture review', color: 'purple' },
	{ day: 2, start: [9, 30], end: [11, 0], title: 'Pairing session', color: 'green' },
	{
		day: 2,
		start: [13, 30],
		end: [16, 0],
		title: 'Reports API',
		color: 'blue',
		taskId: 'task-2',
	},
	{ day: 2, start: [17, 0], end: [18, 0], title: 'Retro', color: 'orange' },

	// Thursday
	{ day: 3, start: [8, 30], end: [9, 0], title: 'Inbox & follow-ups', color: 'yellow' },
	{
		day: 3,
		start: [9, 0],
		end: [12, 0],
		title: 'Focus block — migrations',
		description: 'No meetings. Finish the schema migration.',
		color: 'pink',
		taskId: 'task-3',
	},
	{ day: 3, start: [14, 0], end: [15, 0], title: 'Stakeholder call', color: 'red' },
	{ day: 3, start: [15, 30], end: [17, 0], title: 'Documentation', color: 'green' },

	// Friday
	{ day: 4, start: [9, 0], end: [11, 0], title: 'Focus block — migrations', color: 'blue' },
	{ day: 4, start: [11, 0], end: [11, 30], title: 'Daily sync', color: 'orange' },
	{
		day: 4,
		start: [14, 0],
		end: [15, 0],
		title: 'Weekly report',
		description: 'Consolidate the work logs and send the summary.',
		color: 'purple',
	},
	{ day: 4, start: [16, 0], end: [17, 30], title: 'Tech debt cleanup', color: 'green' },

	// Saturday — so the weekend toggle has something to hide
	{ day: 5, start: [10, 0], end: [12, 0], title: 'Side project', color: 'orange' },
]

function buildPlans(): IPlan[] {
	const weekStart = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON })

	return SEEDS.map((seed, index) => {
		const day = addDays(weekStart, seed.day)
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
			id: `plan-${index + 1}`,
			title: seed.title,
			description: seed.description,
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			color: seed.color,
			taskId: seed.taskId ?? null,
		}
	})
}

export const PLANS_MOCK: IPlan[] = buildPlans()
