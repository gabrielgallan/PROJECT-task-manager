import { instantToCalendarText } from '@/features/calendar/lib/time-zone'
import type { PlanDto } from './plan-api-types'
import type { Plan, PlanCalendarItem } from './plan-types'

export function toPlan(dto: PlanDto): Plan {
	return { ...dto }
}
export function toPlanCalendarItem(plan: Plan, timeZone: string): PlanCalendarItem {
	return {
		id: plan.id,
		startDate: instantToCalendarText(plan.startsAt, timeZone),
		endDate: instantToCalendarText(plan.endsAt, timeZone),
		plan,
	}
}
