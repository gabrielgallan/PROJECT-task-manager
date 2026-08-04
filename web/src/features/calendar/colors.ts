import type { TPlanColor } from '@/features/calendar/types'

/**
 * Tailwind does not generate classes built at runtime (`bg-${color}-500`), so every
 * colour variant has to exist as a literal string somewhere. That is what this file is.
 */

/** Filled block used on the time grid: tinted surface + coloured left accent. */
export const PLAN_SURFACE: Record<TPlanColor, string> = {
	blue: 'border-l-blue-500 bg-blue-50 text-blue-950 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-50 dark:hover:bg-blue-950',
	green:
		'border-l-emerald-500 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-50 dark:hover:bg-emerald-950',
	red: 'border-l-red-500 bg-red-50 text-red-950 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-50 dark:hover:bg-red-950',
	yellow:
		'border-l-yellow-500 bg-yellow-50 text-yellow-950 hover:bg-yellow-100 dark:bg-yellow-950/60 dark:text-yellow-50 dark:hover:bg-yellow-950',
	purple:
		'border-l-purple-500 bg-purple-50 text-purple-950 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-50 dark:hover:bg-purple-950',
	orange:
		'border-l-orange-500 bg-orange-50 text-orange-950 hover:bg-orange-100 dark:bg-orange-950/60 dark:text-orange-50 dark:hover:bg-orange-950',
	pink: 'border-l-rose-500 bg-rose-50 text-rose-950 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-50 dark:hover:bg-rose-950',
}

/** Solid swatch used for dots, pickers and filters. */
export const PLAN_DOT: Record<TPlanColor, string> = {
	blue: 'bg-blue-500',
	green: 'bg-green-500',
	red: 'bg-red-500',
	yellow: 'bg-yellow-500',
	purple: 'bg-purple-500',
	orange: 'bg-orange-500',
	pink: 'bg-rose-500',
}
