import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AccountSettings } from '@/app/pages/settings/components/account-settings'
import { CategoriesSettings } from '@/app/pages/settings/components/categories-settings'
import { SecuritySettings } from '@/app/pages/settings/components/security-settings'
import { SETTINGS_TAB_VALUES, SETTINGS_TABS, type TSettingsTab } from '@/app/pages/settings/config'
import { BrowserTitle } from '@/components/browser-title'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Item } from '@/components/ui/item'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProfile } from '@/features/identity/hooks/use-profile'
import { getDisplayName, getUserInitials } from '@/features/identity/model/identity'
import { NotificationsSettings } from './components/notifications-settings'
import { SystemSettings } from './components/system-settings'

const TAB_SEARCH_PARAM = 'tab'

function isSettingsTab(value: string | null): value is TSettingsTab {
	return value !== null && SETTINGS_TAB_VALUES.includes(value as TSettingsTab)
}

export function SettingsPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const { data } = useProfile()
	const profile = data?.profile

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

	if (!profile) return null

	return (
		<>
			<BrowserTitle title="Settings" />

			<div className="styled-scrollbar mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-20 md:pb-4">
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					orientation="vertical"
					className="grid md:gap-4 md:grid-cols-[14rem_1fr]"
				>
					<aside className="space-y-2">
						<Item className="flex items-center gap-2 bg-muted">
							<Avatar size="lg">
								<AvatarImage src={profile.avatarUrl || undefined} alt={getDisplayName(profile)} />
								<AvatarFallback className="text-base">{getUserInitials(profile)}</AvatarFallback>
							</Avatar>

							<div className="flex flex-col">
								<p className="truncate font-medium">{getDisplayName(profile)}</p>
								<p className="truncate text-xs text-muted-foreground">
									{profile.jobTitle ?? profile.email}
								</p>
							</div>
						</Item>

						<TabsList className="hidden md:flex w-full" variant="default">
							{SETTINGS_TABS.map((tab) => {
								const Icon = tab.icon

								return (
									<TabsTrigger className="px-2 py-1" key={tab.value} value={tab.value}>
										<Icon />
										{tab.label}
									</TabsTrigger>
								)
							})}
						</TabsList>

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
					</aside>

					<TabsContent className="min-w-0 w-full" value="profile">
						<AccountSettings profile={profile} />
					</TabsContent>

					<TabsContent className="min-w-0 w-full" value="notifications">
						<NotificationsSettings />
					</TabsContent>

					<TabsContent className="min-w-0 w-full" value="security">
						<SecuritySettings profile={profile} active={activeTab === 'security'} />
					</TabsContent>

					<TabsContent className="min-w-0 w-full" value="categories">
						<CategoriesSettings />
					</TabsContent>

					<TabsContent className="min-w-0 w-full" value="system">
						<SystemSettings />
					</TabsContent>
				</Tabs>
			</div>
		</>
	)
}
