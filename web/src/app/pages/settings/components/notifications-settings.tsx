import { useState } from 'react'
import { TimeOfDayInput } from '@/app/pages/settings/components/time-of-day-input'
import {
	DEFAULT_NOTIFICATION_SETTINGS,
	type INotificationSettings,
	NOTIFICATION_LEAD_MINUTES,
	type TNotificationLeadMinutes,
} from '@/app/pages/settings/model/notification-settings'
import { Badge } from '@/components/ui/badge'
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

const BROWSER_CHANNEL_DESCRIPTION: Record<TPermission, string> = {
	granted: 'Receive reminders even when another tab is active.',
	default: 'Receive reminders even when another tab is active.',
	denied: "Blocked by the browser. Update this site's permissions to enable it.",
	unsupported: 'This browser does not support system notifications.',
}

export function NotificationsSettings() {
	const [permission, setPermission] = useState<TPermission>(readPermission)
	const [settings, setSettings] = useState<INotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)

	const requestPermission = async () => {
		if (permission === 'unsupported') return

		const nextPermission = await Notification.requestPermission()
		setPermission(nextPermission)

		if (nextPermission === 'granted') {
			setSettings((current) => ({
				...current,
				channels: { ...current.channels, browser: true },
			}))
		}
	}

	const updateChannels = (partial: Partial<INotificationSettings['channels']>) =>
		setSettings((current) => ({
			...current,
			channels: { ...current.channels, ...partial },
		}))

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Notifications</CardTitle>
			</CardHeader>

			<CardContent className="space-y-5">
				<div className="flex flex-col gap-4">
					<FieldSet>
						<FieldLegend variant="legend">Channels</FieldLegend>

						<FieldGroup>
							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel htmlFor="in-app-notifications">In-app notifications</FieldLabel>

										<FieldDescription>Show alerts while the application is open.</FieldDescription>
									</div>

									<Switch
										id="in-app-notifications"
										checked={settings.channels.inApp}
										onCheckedChange={(inApp) => updateChannels({ inApp })}
									/>
								</div>
							</Field>

							<FieldSeparator />

							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel htmlFor="browser-notifications">Browser notifications</FieldLabel>

										<FieldDescription>{BROWSER_CHANNEL_DESCRIPTION[permission]}</FieldDescription>
									</div>

									{permission === 'default' ? (
										<Button type="button" variant="outline" size="sm" onClick={requestPermission}>
											Allow
										</Button>
									) : permission === 'granted' ? (
										<Switch
											id="browser-notifications"
											checked={settings.channels.browser}
											onCheckedChange={(browser) => updateChannels({ browser })}
										/>
									) : (
										<Badge variant="secondary">
											{permission === 'denied' ? 'Blocked' : 'Unavailable'}
										</Badge>
									)}
								</div>
							</Field>
						</FieldGroup>
					</FieldSet>

					<FieldSeparator />

					<FieldSet>
						<FieldLegend variant="legend">Events</FieldLegend>

						<FieldGroup>
							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel htmlFor="plan-reminder">Plan reminder</FieldLabel>

										<FieldDescription>Notify me before a Plan starts.</FieldDescription>
									</div>

									<div className="flex items-center gap-2">
										<Select
											value={String(settings.events.planReminder.leadMinutes)}
											disabled={!settings.events.planReminder.enabled}
											onValueChange={(value) => {
												if (!value) return

												const leadMinutes = Number(value) as TNotificationLeadMinutes
												if (!NOTIFICATION_LEAD_MINUTES.includes(leadMinutes)) return

												setSettings((current) => ({
													...current,
													events: {
														...current.events,
														planReminder: { ...current.events.planReminder, leadMinutes },
													},
												}))
											}}
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
											id="plan-reminder"
											checked={settings.events.planReminder.enabled}
											onCheckedChange={(enabled) =>
												setSettings((current) => ({
													...current,
													events: {
														...current.events,
														planReminder: { ...current.events.planReminder, enabled },
													},
												}))
											}
										/>
									</div>
								</div>
							</Field>

							<FieldSeparator />

							<Field>
								<div className="flex items-center justify-between gap-4">
									<div>
										<FieldLabel>Daily summary</FieldLabel>

										<FieldDescription>
											Tasks due today, overdue Tasks and today's planned hours.
										</FieldDescription>
									</div>

									<div className="flex items-center gap-2">
										<TimeOfDayInput
											id="daily-summary"
											label="Daily summary"
											value={settings.events.dailySummary.time}
											disabled={!settings.events.dailySummary.enabled}
											onChange={(time) =>
												setSettings((current) => ({
													...current,
													events: {
														...current.events,
														dailySummary: { ...current.events.dailySummary, time },
													},
												}))
											}
										/>

										<Switch
											aria-label="Daily summary"
											checked={settings.events.dailySummary.enabled}
											onCheckedChange={(enabled) =>
												setSettings((current) => ({
													...current,
													events: {
														...current.events,
														dailySummary: { ...current.events.dailySummary, enabled },
													},
												}))
											}
										/>
									</div>
								</div>
							</Field>
						</FieldGroup>
					</FieldSet>
				</div>
			</CardContent>
		</Card>
	)
}
