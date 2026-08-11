import { WORK_DAY_END_HOUR, WORK_DAY_START_HOUR } from '@/features/calendar/constants'

/** How early a plan can announce itself, in minutes. */
export const NOTIFICATION_LEAD_MINUTES = [5, 10, 15, 30] as const

export type TNotificationLeadMinutes = (typeof NOTIFICATION_LEAD_MINUTES)[number]

/**
 * Times are held as dates because the picker works on them. Persistence will
 * carry only the time of day, as 'HH:mm'.
 */
export interface INotificationSettings {
	enabled: boolean
	/** Announces a plan shortly before it starts. */
	planStart: { enabled: boolean; leadMinutes: TNotificationLeadMinutes }
	/** Offers to record the block as work once it ends, while it is still fresh. */
	planEnd: { enabled: boolean }
	morningBriefing: { enabled: boolean; time: Date }
	loggingReminder: { enabled: boolean; time: Date }
	respectWorkingHours: boolean
	systemWhenInBackground: boolean
}

function atTimeOfDay(hours: number, minutes: number) {
	const date = new Date()
	date.setHours(hours, minutes, 0, 0)

	return date
}

export const DEFAULT_NOTIFICATION_SETTINGS: INotificationSettings = {
	enabled: true,
	planStart: { enabled: true, leadMinutes: 10 },
	planEnd: { enabled: true },
	// Anchored to the working day, so the defaults follow whatever it is set to.
	morningBriefing: { enabled: true, time: atTimeOfDay(WORK_DAY_START_HOUR, 30) },
	loggingReminder: { enabled: true, time: atTimeOfDay(WORK_DAY_END_HOUR - 1, 45) },
	respectWorkingHours: true,
	systemWhenInBackground: true,
}
