import { useState } from 'react'
import { TimeOfDayInput } from '@/app/pages/settings/components/time-of-day-input'
import {
	DEFAULT_NOTIFICATION_SETTINGS,
	type INotificationSettings,
	NOTIFICATION_LEAD_MINUTES,
	type TNotificationLeadMinutes,
} from '@/app/pages/settings/model/notification-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
} from '@/components/ui/field'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

type TPermission = NotificationPermission | 'unsupported'

function readPermission(): TPermission {
	return typeof window !== 'undefined' && 'Notification' in window
		? Notification.permission
		: 'unsupported'
}

const PERMISSION_DESCRIPTION: Record<TPermission, string> = {
	granted: 'Alerts and reminders about your plans and deadlines.',
	default: 'The browser has not been asked for permission yet.',
	denied: 'The browser is blocking notifications for this site.',
	unsupported: 'This browser does not support notifications.',
}

export function NotificationsSettings() {
	const [permission, setPermission] = useState<TPermission>(readPermission)
	const [settings, setSettings] = useState<INotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)

	// Without permission the switches would promise something that never arrives.
	const isBlocked = permission !== 'granted'
	const isDisabled = isBlocked || !settings.enabled

	const requestPermission = async () => {
		setPermission(await Notification.requestPermission())
	}

	const update = (partial: Partial<INotificationSettings>) =>
		setSettings((current) => ({ ...current, ...partial }))

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Notifications</CardTitle>
			</CardHeader>

			<CardContent className="space-y-5">
				<div className="flex flex-col gap-4">
					<FieldSet>
						<FieldGroup>
							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel htmlFor="notifications-enabled">Enable notifications</FieldLabel>

										<FieldDescription>{PERMISSION_DESCRIPTION[permission]}</FieldDescription>
									</div>

									{permission === 'default' ? (
										<Button type="button" variant="outline" size="sm" onClick={requestPermission}>
											Allow
										</Button>
									) : (
										<Switch
											id="notifications-enabled"
											checked={settings.enabled && !isBlocked}
											disabled={isBlocked}
											onCheckedChange={(enabled) => update({ enabled })}
										/>
									)}
								</div>
							</Field>
						</FieldGroup>
					</FieldSet>

					<FieldSeparator />

					<FieldSet>
						<FieldLegend variant="label">Alerts</FieldLegend>

						<FieldGroup>
							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel htmlFor="plan-start">Plan is about to start</FieldLabel>

										<FieldDescription>Announces the block before it begins</FieldDescription>
									</div>

									<div className="flex items-center gap-2">
										<Select
											value={String(settings.planStart.leadMinutes)}
											disabled={isDisabled || !settings.planStart.enabled}
											onValueChange={(value) =>
												update({
													planStart: {
														...settings.planStart,
														leadMinutes: Number(value) as TNotificationLeadMinutes,
													},
												})
											}
										>
											<SelectTrigger aria-label="Lead time" className="w-fit">
												<SelectValue>{(value: string) => `${value} min before`}</SelectValue>
											</SelectTrigger>

											<SelectContent>
												{NOTIFICATION_LEAD_MINUTES.map((minutes) => (
													<SelectItem key={minutes} value={String(minutes)}>
														{minutes} min before
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<Switch
											id="plan-start"
											checked={settings.planStart.enabled}
											disabled={isDisabled}
											onCheckedChange={(enabled) =>
												update({ planStart: { ...settings.planStart, enabled } })
											}
										/>
									</div>
								</div>
							</Field>

							<FieldSeparator />

							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel htmlFor="plan-end">Plan has ended</FieldLabel>

										<FieldDescription>
											Offers to record the block as work while it is still fresh
										</FieldDescription>
									</div>

									<Switch
										id="plan-end"
										checked={settings.planEnd.enabled}
										disabled={isDisabled}
										onCheckedChange={(enabled) => update({ planEnd: { enabled } })}
									/>
								</div>
							</Field>
						</FieldGroup>
					</FieldSet>

					<FieldSeparator />

					<FieldSet>
						<FieldLegend variant="label">Daily summaries</FieldLegend>

						<FieldGroup>
							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel>Morning briefing</FieldLabel>

										<FieldDescription>
											Tasks due today, overdue ones and hours planned
										</FieldDescription>
									</div>

									<div className="flex items-center gap-2">
										<TimeOfDayInput
											id="morning-briefing"
											label="Morning briefing"
											value={settings.morningBriefing.time}
											disabled={isDisabled || !settings.morningBriefing.enabled}
											onChange={(time) =>
												update({ morningBriefing: { ...settings.morningBriefing, time } })
											}
										/>

										<Switch
											aria-label="Morning briefing"
											checked={settings.morningBriefing.enabled}
											disabled={isDisabled}
											onCheckedChange={(enabled) =>
												update({ morningBriefing: { ...settings.morningBriefing, enabled } })
											}
										/>
									</div>
								</div>
							</Field>

							<FieldSeparator />

							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel>Logging reminder</FieldLabel>

										<FieldDescription>
											Points out time left unrecorded before the day ends
										</FieldDescription>
									</div>

									<div className="flex items-center gap-2">
										<TimeOfDayInput
											id="logging-reminder"
											label="Logging reminder"
											value={settings.loggingReminder.time}
											disabled={isDisabled || !settings.loggingReminder.enabled}
											onChange={(time) =>
												update({ loggingReminder: { ...settings.loggingReminder, time } })
											}
										/>

										<Switch
											aria-label="Logging reminder"
											checked={settings.loggingReminder.enabled}
											disabled={isDisabled}
											onCheckedChange={(enabled) =>
												update({ loggingReminder: { ...settings.loggingReminder, enabled } })
											}
										/>
									</div>
								</div>
							</Field>
						</FieldGroup>
					</FieldSet>

					<FieldSeparator />

					<FieldSet>
						<FieldLegend variant="label">Delivery</FieldLegend>

						<FieldGroup>
							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel htmlFor="working-hours-only">Only during working hours</FieldLabel>

										<FieldDescription>Working hours are set in the System tab</FieldDescription>
									</div>

									<Switch
										id="working-hours-only"
										checked={settings.respectWorkingHours}
										disabled={isDisabled}
										onCheckedChange={(respectWorkingHours) => update({ respectWorkingHours })}
									/>
								</div>
							</Field>

							<FieldSeparator />

							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel htmlFor="system-notifications">
											System notifications in the background
										</FieldLabel>

										<FieldDescription>
											While the app is in focus, alerts show inside it instead
										</FieldDescription>
									</div>

									<Switch
										id="system-notifications"
										checked={settings.systemWhenInBackground}
										disabled={isDisabled}
										onCheckedChange={(systemWhenInBackground) => update({ systemWhenInBackground })}
									/>
								</div>
							</Field>
						</FieldGroup>
					</FieldSet>
				</div>
			</CardContent>
		</Card>
	)
}
