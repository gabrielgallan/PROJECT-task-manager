import {
	Calendar,
	CalendarPlus,
	ChartColumnBig,
	ChartNoAxesGantt,
	FileChartLine,
	FileClock,
	FilePlusCorner,
	type LucideIcon,
	Plus,
} from 'lucide-react'

export type TAppNavigationGroup = 'registers' | 'analytics'

export interface IAppNavigationItem {
	label: string
	mobileLabel: string
	path: string
	icon: LucideIcon
	group: TAppNavigationGroup
	keywords: string[]
}

export const APP_NAVIGATION_ITEMS = [
	{
		label: 'Tasks',
		mobileLabel: 'Tasks',
		path: '/registers/tasks',
		icon: ChartNoAxesGantt,
		group: 'registers',
		keywords: ['task', 'todo', 'work item'],
	},
	{
		label: 'Plans',
		mobileLabel: 'Plans',
		path: '/registers/plans',
		icon: Calendar,
		group: 'registers',
		keywords: ['plan', 'calendar', 'schedule'],
	},
	{
		label: 'Work logs',
		mobileLabel: 'Work logs',
		path: '/registers/work-logs',
		icon: FileClock,
		group: 'registers',
		keywords: ['work log', 'time', 'timesheet', 'logged work'],
	},
	{
		label: 'Dashboard',
		mobileLabel: 'Stats',
		path: '/analytics/dashboard',
		icon: ChartColumnBig,
		group: 'analytics',
		keywords: ['dashboard', 'stats', 'analytics', 'overview'],
	},
	{
		label: 'Reports',
		mobileLabel: 'Reports',
		path: '/analytics/reports',
		icon: FileChartLine,
		group: 'analytics',
		keywords: ['report', 'analytics', 'summary'],
	},
] as const satisfies readonly IAppNavigationItem[]

export const APP_NAVIGATION_GROUPS = [
	{ value: 'registers', label: undefined },
	{ value: 'analytics', label: 'Analytics' },
] as const satisfies readonly { value: TAppNavigationGroup; label: string | undefined }[]

export interface IAppQuickAction {
	label: string
	path: string
	icon: LucideIcon
	keywords: string[]
}

export const APP_QUICK_ACTIONS = [
	{
		label: 'Create task',
		path: '/registers/tasks',
		icon: Plus,
		keywords: ['new task', 'add task', 'todo'],
	},
	{
		label: 'Create plan',
		path: '/registers/plans',
		icon: CalendarPlus,
		keywords: ['new plan', 'add plan', 'calendar', 'schedule'],
	},
	{
		label: 'Create work log',
		path: '/registers/work-logs',
		icon: FilePlusCorner,
		keywords: ['new work log', 'log work', 'time', 'timesheet'],
	},
] as const satisfies readonly IAppQuickAction[]
