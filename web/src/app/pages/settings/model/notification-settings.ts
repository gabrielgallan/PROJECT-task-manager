import { WORK_DAY_START_HOUR } from '@/features/calendar/constants'

/** How early a plan can announce itself, in minutes. */
export const NOTIFICATION_LEAD_MINUTES = [5, 10, 15, 30] as const

export type TNotificationLeadMinutes = (typeof NOTIFICATION_LEAD_MINUTES)[number]

/**
 * Times are held as dates because the picker works on them. Persistence will
 * carry only the time of day, as 'HH:mm'.
 */
export interface INotificationSettings {
	channels: {
		inApp: boolean
		browser: boolean
	}
	events: {
		/** Announces a plan shortly before it starts. */
		planReminder: { enabled: boolean; leadMinutes: TNotificationLeadMinutes }
		dailySummary: { enabled: boolean; time: Date }
	}
}

function atTimeOfDay(hours: number, minutes: number) {
	const date = new Date()
	date.setHours(hours, minutes, 0, 0)

	return date
}

export const DEFAULT_NOTIFICATION_SETTINGS: INotificationSettings = {
	channels: {
		inApp: true,
		browser: true,
	},
	events: {
		planReminder: { enabled: true, leadMinutes: 10 },
		// Anchored to the working day, so the default follows whatever it is set to.
		dailySummary: { enabled: true, time: atTimeOfDay(WORK_DAY_START_HOUR, 30) },
	},
}
