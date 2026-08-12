import { GanttChartSquare, KanbanSquare, TableProperties } from 'lucide-react'
import type { IViewOption } from '@/components/page-view-tabs'

/**
 * The first view is the default one, and the one the toolbar falls back to.
 * The order follows what each view answers: find and compare, then follow the
 * flow, then read the work against time.
 */
export const TASK_VIEWS = [
	{ value: 'list', label: 'Table', icon: TableProperties },
	{ value: 'timeline', label: 'Timeline', icon: GanttChartSquare },
	{ value: 'board', label: 'Board', icon: KanbanSquare },
] as const satisfies readonly IViewOption[]

export type TTaskView = (typeof TASK_VIEWS)[number]['value']

export const TASK_VIEW_VALUES = TASK_VIEWS.map((view) => view.value) as readonly TTaskView[]

export const DEFAULT_TASK_VIEW: TTaskView = TASK_VIEWS[0].value
