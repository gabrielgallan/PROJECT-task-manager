import type { ReactNode } from 'react'

export const CALENDAR_VIEWS = ['day', 'week', 'month', 'agenda'] as const

export type TCalendarView = (typeof CALENDAR_VIEWS)[number]

export interface ICalendarItem {
	id: string
	startDate: string
	endDate: string
}

export interface ICalendarCell {
	day: number
	currentMonth: boolean
	date: Date
}

export interface ICalendarRange {
	startDate: Date
	endDate: Date
}

export interface ICalendarVisibleRange extends ICalendarRange {
	view: TCalendarView
}

export type TCalendarItemVariant = 'time' | 'month' | 'agenda' | 'all-day'

export interface ICalendarItemRenderContext {
	variant: TCalendarItemVariant
	startDate: Date
	endDate: Date
	isCompact: boolean
}

export interface ICalendarToolbarContext {
	selectedDate: Date
	view: TCalendarView
}

export interface ICalendarToolbarActions {
	filters?: ReactNode
	beforeViews?: ReactNode
	afterSettings?: ReactNode
}

export interface ICalendarRuntimeContext extends ICalendarToolbarContext {
	use24HourFormat: boolean
}

export interface ICalendarSettingsConfig {
	timeFormat?: boolean
	weekends?: boolean
}

export interface ICalendarProps<TItem extends ICalendarItem> {
	items: TItem[]
	defaultView?: TCalendarView
	availableViews?: readonly TCalendarView[]
	settings?: false | ICalendarSettingsConfig
	storageKey?: string
	className?: string
	onCreate?: (range: ICalendarRange) => void
	onOpen?: (item: TItem) => void
	onMove?: (item: TItem, range: ICalendarRange) => void
	onResize?: (item: TItem, range: ICalendarRange) => void
	onVisibleRangeChange?: (range: ICalendarVisibleRange) => void
	itemsRange?: ICalendarRange | null
	getNow?: () => Date
	renderItem: (item: TItem, context: ICalendarItemRenderContext) => ReactNode
	getItemClassName?: (item: TItem, context: ICalendarItemRenderContext) => string
	isItemDisabled?: (item: TItem) => boolean
	getAgendaEmptyText?: (selectedDate: Date) => string
	renderToolbarActions?: (context: ICalendarToolbarContext) => ICalendarToolbarActions
	renderSettingsItems?: () => ReactNode
	renderOverlay?: (context: ICalendarRuntimeContext) => ReactNode
}
