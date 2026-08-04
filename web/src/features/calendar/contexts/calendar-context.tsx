import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react'
import { DEFAULT_PLAN_DURATION } from '@/features/calendar/constants'
import { useLocalStorage } from '@/features/calendar/hooks'
import type { IPlan } from '@/features/calendar/interfaces'
import type { TCalendarView, TPlanColor } from '@/features/calendar/types'

/**
 * The dialog is mounted once, at the calendar root, and driven from here. Grid
 * cells only dispatch intent — they never mount a form of their own.
 */
export type TPlanDialogState =
	| { mode: 'closed' }
	| { mode: 'create'; startDate: Date; endDate: Date }
	| { mode: 'edit'; plan: IPlan }

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

interface ICalendarContext {
	// Data
	plans: IPlan[]
	addPlan: (plan: IPlan) => void
	updatePlan: (plan: IPlan) => void
	removePlan: (planId: IPlan['id']) => void

	// Navigation
	selectedDate: Date
	setSelectedDate: (date: Date | undefined) => void
	goToToday: () => void

	// Settings
	view: TCalendarView
	setView: (view: TCalendarView) => void
	use24HourFormat: boolean
	toggleTimeFormat: () => void
	showWeekends: boolean
	toggleWeekends: () => void

	// Filtering
	selectedColors: TPlanColor[]
	toggleColorFilter: (color: TPlanColor) => void
	clearFilters: () => void

	// Dialog
	dialog: TPlanDialogState
	openCreatePlan: (startDate: Date, endDate?: Date) => void
	openEditPlan: (plan: IPlan) => void
	closeDialog: () => void
}

const CalendarContext = createContext<ICalendarContext | null>(null)

interface ICalendarProviderProps {
	children: ReactNode
	plans: IPlan[]
	/** Applied only the first time the calendar runs; afterwards the stored preference wins. */
	defaultView?: TCalendarView
}

export function CalendarProvider({ children, plans, defaultView }: ICalendarProviderProps) {
	const [settings, setSettings] = useLocalStorage<ICalendarSettings>('calendar-settings', {
		...DEFAULT_SETTINGS,
		...(defaultView ? { view: defaultView } : {}),
	})

	const [allPlans, setAllPlans] = useState<IPlan[]>(plans)
	const [selectedDate, setSelectedDate] = useState(() => new Date())
	const [selectedColors, setSelectedColors] = useState<TPlanColor[]>([])
	const [dialog, setDialog] = useState<TPlanDialogState>({ mode: 'closed' })

	const updateSettings = useCallback(
		(partial: Partial<ICalendarSettings>) => setSettings({ ...settings, ...partial }),
		[settings, setSettings],
	)

	// -- Data ---------------------------------------------------------------

	const addPlan = useCallback((plan: IPlan) => {
		setAllPlans((previous) => [...previous, plan])
	}, [])

	const updatePlan = useCallback((plan: IPlan) => {
		setAllPlans((previous) => previous.map((item) => (item.id === plan.id ? plan : item)))
	}, [])

	const removePlan = useCallback((planId: IPlan['id']) => {
		setAllPlans((previous) => previous.filter((item) => item.id !== planId))
	}, [])

	// Filtering is derived, not a second copy of the list — that was the source of
	// the previous drift between `allEvents` and `filteredEvents`.
	const visiblePlans = useMemo(() => {
		if (selectedColors.length === 0) return allPlans
		return allPlans.filter((plan) => selectedColors.includes(plan.color))
	}, [allPlans, selectedColors])

	// -- Navigation ---------------------------------------------------------

	const handleSelectDate = useCallback((date: Date | undefined) => {
		if (!date) return
		setSelectedDate(date)
	}, [])

	const goToToday = useCallback(() => setSelectedDate(new Date()), [])

	// -- Filtering ----------------------------------------------------------

	const toggleColorFilter = useCallback((color: TPlanColor) => {
		setSelectedColors((previous) =>
			previous.includes(color) ? previous.filter((item) => item !== color) : [...previous, color],
		)
	}, [])

	const clearFilters = useCallback(() => setSelectedColors([]), [])

	// -- Dialog -------------------------------------------------------------

	const openCreatePlan = useCallback((startDate: Date, endDate?: Date) => {
		setDialog({
			mode: 'create',
			startDate,
			endDate: endDate ?? new Date(startDate.getTime() + DEFAULT_PLAN_DURATION * 60_000),
		})
	}, [])

	const openEditPlan = useCallback((plan: IPlan) => setDialog({ mode: 'edit', plan }), [])
	const closeDialog = useCallback(() => setDialog({ mode: 'closed' }), [])

	const value = useMemo<ICalendarContext>(
		() => ({
			plans: visiblePlans,
			addPlan,
			updatePlan,
			removePlan,
			selectedDate,
			setSelectedDate: handleSelectDate,
			goToToday,
			view: settings.view,
			setView: (view) => updateSettings({ view }),
			use24HourFormat: settings.use24HourFormat,
			toggleTimeFormat: () => updateSettings({ use24HourFormat: !settings.use24HourFormat }),
			showWeekends: settings.showWeekends,
			toggleWeekends: () => updateSettings({ showWeekends: !settings.showWeekends }),
			selectedColors,
			toggleColorFilter,
			clearFilters,
			dialog,
			openCreatePlan,
			openEditPlan,
			closeDialog,
		}),
		[
			visiblePlans,
			addPlan,
			updatePlan,
			removePlan,
			selectedDate,
			handleSelectDate,
			goToToday,
			settings,
			updateSettings,
			selectedColors,
			toggleColorFilter,
			clearFilters,
			dialog,
			openCreatePlan,
			openEditPlan,
			closeDialog,
		],
	)

	return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}

export function useCalendar(): ICalendarContext {
	const context = useContext(CalendarContext)
	if (!context) throw new Error('useCalendar must be used within a CalendarProvider.')
	return context
}
