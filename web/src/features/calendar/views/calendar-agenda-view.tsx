import { format, isSameMonth, isToday, parseISO } from 'date-fns'
import { CalendarOff } from 'lucide-react'
import { useMemo } from 'react'
import { PLAN_SURFACE } from '@/features/calendar/colors'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { formatDuration, formatTime } from '@/features/calendar/helpers'
import type { IPlan } from '@/features/calendar/interfaces'
import { cn } from '@/lib/utils'

export function CalendarAgendaView({ plans }: { plans: IPlan[] }) {
	const { selectedDate, use24HourFormat, openEditPlan } = useCalendar()

	const groups = useMemo(() => {
		const monthPlans = plans
			.filter((plan) => isSameMonth(parseISO(plan.startDate), selectedDate))
			.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())

		const byDay = new Map<string, IPlan[]>()
		for (const plan of monthPlans) {
			const key = format(parseISO(plan.startDate), 'yyyy-MM-dd')
			const bucket = byDay.get(key)
			if (bucket) bucket.push(plan)
			else byDay.set(key, [plan])
		}

		return [...byDay.entries()]
	}, [plans, selectedDate])

	if (groups.length === 0) {
		return (
			<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
				<CalendarOff className="size-6" />
				<p className="text-sm">No plans for {format(selectedDate, 'MMMM yyyy')}.</p>
			</div>
		)
	}

	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<div className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
				{groups.map(([key, dayPlans]) => {
					const day = parseISO(key)

					return (
						<section key={key} className="flex gap-4">
							<div className="w-14 shrink-0 pt-1 text-right">
								<p className="text-[11px] uppercase text-muted-foreground">{format(day, 'EEE')}</p>
								<p
									className={cn(
										'text-lg font-semibold tabular-nums',
										isToday(day) && 'text-primary',
									)}
								>
									{format(day, 'd')}
								</p>
							</div>

							<div className="flex flex-1 flex-col gap-1.5">
								{dayPlans.map((plan) => {
									const start = parseISO(plan.startDate)
									const end = parseISO(plan.endDate)

									return (
										<button
											key={plan.id}
											type="button"
											onClick={() => openEditPlan(plan)}
											className={cn(
												'flex flex-col gap-0.5 rounded-xs border border-l-4 border-transparent px-3 py-2 text-left transition-colors',
												PLAN_SURFACE[plan.color],
											)}
										>
											<div className="flex items-baseline justify-between gap-3">
												<span className="truncate text-sm font-medium">{plan.title}</span>
												<span className="shrink-0 text-xs tabular-nums opacity-70">
													{formatTime(start, use24HourFormat)} – {formatTime(end, use24HourFormat)}
												</span>
											</div>

											<div className="flex items-baseline justify-between gap-3">
												<span className="truncate text-xs opacity-70">{plan.description}</span>
												<span className="shrink-0 text-xs opacity-60">
													{formatDuration(start, end)}
												</span>
											</div>
										</button>
									)
								})}
							</div>
						</section>
					)
				})}
			</div>
		</div>
	)
}
