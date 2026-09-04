import { instantToCalendarText } from '@/features/calendar/lib/time-zone'
import type { CreatedWorkLogDto, WorkLogDto } from './work-log-api-types'
import type { CreatedWorkLog, WorkLog, WorkLogCalendarItem } from './work-log-types'

export function toWorkLog(dto: WorkLogDto): WorkLog {
	return { ...dto }
}

export function toCreatedWorkLog(dto: CreatedWorkLogDto): CreatedWorkLog {
	return { ...dto }
}

export function toWorkLogCalendarItem(workLog: WorkLog, timeZone: string): WorkLogCalendarItem {
	return {
		id: workLog.id,
		startDate: instantToCalendarText(workLog.startsAt, timeZone),
		endDate: instantToCalendarText(workLog.endsAt, timeZone),
		workLog,
	}
}
