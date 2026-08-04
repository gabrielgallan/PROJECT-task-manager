import { differenceInCalendarDays, endOfDay, isWithinInterval, parseISO, startOfDay } from 'date-fns'
import { useMemo } from 'react'
import { PLAN_SURFACE } from '@/features/calendar/colors'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import type { IPlan } from '@/features/calendar/interfaces'
import { cn } from '@/lib/utils'

interface IProps {
	days: Date[]
	plans: IPlan[]
}

interface IRowItem {
	plan: IPlan
	startIndex: number
	span: number
}

/**
 * Strip above the time grid for plans that cross midnight. Packs them into as few
 * rows as possible so a busy week does not push the grid off screen.
 */
export function AllDayRow({ days, plans }: IProps) {
	const { openEditPlan } = useCalendar()

	const rows = useMemo(() => {
		if (days.length === 0) return []

		const rangeStart = startOfDay(days[0])
		const rangeEnd = endOfDay(days[days.length - 1])

		const items: IRowItem[] = plans
			.filter((plan) => {
				const start = parseISO(plan.startDate)
				const end = parseISO(plan.endDate)
				return start <= rangeEnd && end >= rangeStart
			})
			.map((plan) => {
				const start = parseISO(plan.startDate)
				const end = parseISO(plan.endDate)
				const clampedStart = start < rangeStart ? rangeStart : start
				const clampedEnd = end > rangeEnd ? rangeEnd : end
				const startIndex = differenceInCalendarDays(clampedStart, rangeStart)
				const endIndex = differenceInCalendarDays(clampedEnd, rangeStart)
				return { plan, startIndex, span: endIndex - startIndex + 1 }
			})
			.sort((a, b) => a.startIndex - b.startIndex || b.span - a.span)

		const packed: IRowItem[][] = []
		for (const item of items) {
			const row = packed.find((candidate) =>
				candidate.every(
					(placed) =>
						placed.startIndex + placed.span <= item.startIndex ||
						item.startIndex + item.span <= placed.startIndex,
				),
			)
			if (row) row.push(item)
			else packed.push([item])
		}

		return packed
	}, [days, plans])

	if (rows.length === 0) return null

	return (
		<div className="flex flex-col gap-px py-1">
			{rows.map((row, rowIndex) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional, not identities
				<div key={rowIndex} className="grid gap-px" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
					{row.map((item) => (
						<button
							key={item.plan.id}
							type="button"
							onClick={() => openEditPlan(item.plan)}
							style={{ gridColumn: `${item.startIndex + 1} / span ${item.span}` }}
							className={cn(
								'truncate rounded border border-l-4 border-transparent px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors',
								PLAN_SURFACE[item.plan.color],
							)}
						>
							{item.plan.title}
						</button>
					))}
				</div>
			))}
		</div>
	)
}

/** True when a plan does not fit inside a single calendar day. */
export function isMultiDay(plan: IPlan): boolean {
	const start = parseISO(plan.startDate)
	const end = parseISO(plan.endDate)
	return !isWithinInterval(end, { start: startOfDay(start), end: endOfDay(start) })
}
