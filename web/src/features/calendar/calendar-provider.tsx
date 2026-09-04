import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import type { TCalendarView } from '@/features/calendar/types'
import { useLocalStorage } from '@/hooks/use-local-storage'

interface ICalendarSettings {
	view: TCalendarView
	use24HourFormat: boolean
	showWeekends: boolean
}

const DEFAULT_SETTINGS: ICalendarSettings = {
	view: 'week',
	use24HourFormat: true,
	showWeekends: false,
}

const getLocalNow = () => new Date()

interface ICalendarContext {
	selectedDate: Date
	setSelectedDate: (date: Date | undefined) => void
	view: TCalendarView
	setView: (view: TCalendarView) => void
	use24HourFormat: boolean
	toggleTimeFormat: () => void
	showWeekends: boolean
	toggleWeekends: () => void
	getNow: () => Date
}

const CalendarContext = createContext<ICalendarContext | null>(null)

interface ICalendarProviderProps {
	children: ReactNode
	defaultView?: TCalendarView
	availableViews: readonly TCalendarView[]
	storageKey: string
	getNow?: () => Date
}

export function CalendarProvider({
	children,
	defaultView,
	availableViews,
	storageKey,
	getNow = getLocalNow,
}: ICalendarProviderProps) {
	const fallbackView =
		defaultView && availableViews.includes(defaultView)
			? defaultView
			: (availableViews[0] ?? DEFAULT_SETTINGS.view)
	const [settings, setSettings] = useLocalStorage<ICalendarSettings>(storageKey, {
		...DEFAULT_SETTINGS,
		view: fallbackView,
	})
	const [selectedDate, setSelectedDate] = useState(getNow)
	const view = availableViews.includes(settings.view) ? settings.view : fallbackView

	const updateSettings = useCallback(
		(partial: Partial<ICalendarSettings>) => {
			setSettings((previous) => ({ ...previous, ...partial }))
		},
		[setSettings],
	)

	useEffect(() => {
		if (settings.view !== view) updateSettings({ view })
	}, [settings.view, updateSettings, view])

	const handleSelectDate = useCallback((date: Date | undefined) => {
		if (date) setSelectedDate(date)
	}, [])

	const value = useMemo<ICalendarContext>(
		() => ({
			selectedDate,
			setSelectedDate: handleSelectDate,
			view,
			setView: (nextView) => {
				if (availableViews.includes(nextView)) updateSettings({ view: nextView })
			},
			use24HourFormat: settings.use24HourFormat,
			toggleTimeFormat: () => updateSettings({ use24HourFormat: !settings.use24HourFormat }),
			showWeekends: settings.showWeekends,
			toggleWeekends: () => updateSettings({ showWeekends: !settings.showWeekends }),
			getNow,
		}),
		[selectedDate, handleSelectDate, settings, updateSettings, view, availableViews, getNow],
	)

	return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}

export function useCalendar(): ICalendarContext {
	const context = useContext(CalendarContext)
	if (!context) throw new Error('useCalendar must be used within a CalendarProvider.')
	return context
}

/**
 * For components that render calendar items outside the calendar itself, like a
 * dashboard card. Returns null instead of throwing when there is no provider.
 */
export function useOptionalCalendar(): ICalendarContext | null {
	return useContext(CalendarContext)
}
