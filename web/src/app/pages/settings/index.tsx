import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProfileSettings } from '@/app/pages/settings/components/profile-settings'
import { SecuritySettings } from '@/app/pages/settings/components/security-settings'
import { SETTINGS_TAB_VALUES, SETTINGS_TABS, type TSettingsTab } from '@/app/pages/settings/config'
import { PROFILE_MOCK } from '@/app/pages/settings/model/profile-settings'
import { BrowserTitle } from '@/components/browser-title'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationsSettings } from './components/notifications-settings'
import { SystemSettings } from './components/system-settings'

const TAB_SEARCH_PARAM = 'tab'

function isSettingsTab(value: string | null): value is TSettingsTab {
	return value !== null && SETTINGS_TAB_VALUES.includes(value as TSettingsTab)
}

export function SettingsPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [profile, setProfile] = useState(PROFILE_MOCK)

	const tabParam = searchParams.get(TAB_SEARCH_PARAM)

	const activeTab = isSettingsTab(tabParam) ? tabParam : 'profile'

	useEffect(() => {
		if (!tabParam || isSettingsTab(tabParam)) return

		setSearchParams(
			(previous) => {
				const next = new URLSearchParams(previous)
				next.delete(TAB_SEARCH_PARAM)
				return next
			},
			{ replace: true },
		)
	}, [setSearchParams, tabParam])

	const handleTabChange = (nextTab: string | null) => {
		if (!isSettingsTab(nextTab)) return

		setSearchParams(
			(previous) => {
				const next = new URLSearchParams(previous)

				if (nextTab === 'profile') {
					next.delete(TAB_SEARCH_PARAM)
				} else {
					next.set(TAB_SEARCH_PARAM, nextTab)
				}

				return next
			},
			{ replace: true },
		)
	}

	return (
		<>
			<BrowserTitle title="Settings" />

			<div className="styled-scrollbar mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-20 md:pb-4">
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					orientation="vertical"
					className="grid gap-4 md:grid-cols-[16rem_1fr]"
				>
					<div className="md:hidden">
						<Select value={activeTab} onValueChange={handleTabChange}>
							<SelectTrigger className="w-full" aria-label="Settings section">
								<SelectValue>
									{(value: TSettingsTab) => {
										const selected =
											SETTINGS_TABS.find((tab) => tab.value === value) ?? SETTINGS_TABS[0]
										const Icon = selected.icon

										return (
											<span className="flex items-center gap-2">
												<Icon className="size-4" />
												{selected.label}
											</span>
										)
									}}
								</SelectValue>
							</SelectTrigger>

							<SelectContent align="start">
								{SETTINGS_TABS.map((tab) => {
									const Icon = tab.icon

									return (
										<SelectItem key={tab.value} value={tab.value}>
											<Icon className="size-4" />
											{tab.label}
										</SelectItem>
									)
								})}
							</SelectContent>
						</Select>
					</div>

					<aside className="md:space-y-4">
						<Card className="">
							<CardContent className="flex flex-col items-center gap-2 py-4">
								<Avatar size="lg">
									<AvatarImage src={profile.avatarUrl} alt={profile.name} />
									<AvatarFallback className="text-base">GG</AvatarFallback>

									<AvatarBadge className="bg-emerald-400 dark:bg-emerald-500" />
								</Avatar>

								<div className="flex flex-col items-center">
									<p className="truncate font-medium">{profile.name}</p>
									<p className="truncate text-xs text-muted-foreground">
										@{profile.username}
										{profile.jobTitle ? ` / ${profile.jobTitle}` : ''}
									</p>
								</div>
							</CardContent>
						</Card>

						<TabsList className="hidden md:flex w-full">
							{SETTINGS_TABS.map((tab) => {
								const Icon = tab.icon

								return (
									<TabsTrigger className="px-2 py-1.5" key={tab.value} value={tab.value}>
										<Icon />
										{tab.label}
									</TabsTrigger>
								)
							})}
						</TabsList>
					</aside>

					<TabsContent className="min-w-0 w-full" value="profile">
						<ProfileSettings profile={profile} onProfileChange={setProfile} />
					</TabsContent>

					<TabsContent className="min-w-0 w-full" value="notifications">
						<NotificationsSettings />
					</TabsContent>

					<TabsContent className="min-w-0 w-full" value="security">
						<SecuritySettings />
					</TabsContent>

					<TabsContent className="min-w-0 w-full" value="system">
						<SystemSettings />
					</TabsContent>
				</Tabs>
			</div>
		</>
	)
}
