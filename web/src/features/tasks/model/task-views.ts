import { ChartNoAxesGantt, List } from 'lucide-react'
import type { IViewOption } from '@/hooks/use-route-handle'

/** The first view is the default one, and the one the header falls back to. */
export const TASK_VIEWS = [
	{ value: 'list', label: 'List', icon: List },
	{ value: 'timeline', label: 'Timeline', icon: ChartNoAxesGantt },
] as const satisfies readonly IViewOption[]

export type TTaskView = (typeof TASK_VIEWS)[number]['value']

export const TASK_VIEW_VALUES = TASK_VIEWS.map((view) => view.value) as readonly TTaskView[]

export const DEFAULT_TASK_VIEW: TTaskView = TASK_VIEWS[0].value
