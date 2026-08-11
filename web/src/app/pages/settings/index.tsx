import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProfileSettings } from '@/app/pages/settings/components/profile-settings'
import { SETTINGS_TAB_VALUES, SETTINGS_TABS, type TSettingsTab } from '@/app/pages/settings/config'
import { BrowserTitle } from '@/components/browser-title'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TAB_SEARCH_PARAM = 'tab'

function isSettingsTab(value: string | null): value is TSettingsTab {
	return value !== null && SETTINGS_TAB_VALUES.includes(value as TSettingsTab)
}

export function SettingsPage() {
	const [searchParams, setSearchParams] = useSearchParams()

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

			<div className="styled-scrollbar min-h-0 flex-1 overflow-auto">
				<div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-4 md:p-6">
					<header className="space-y-1">
						<h1 className="text-xl font-semibold tracking-tight">Settings</h1>

						<p className="text-sm text-muted-foreground">
							Manage your account and personalize how the application works for you.
						</p>
					</header>

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

					<Tabs
						value={activeTab}
						onValueChange={handleTabChange}
						orientation="vertical"
						className="w-full items-start gap-6"
					>
						<TabsList>
							{SETTINGS_TABS.map((tab) => {
								const Icon = tab.icon

								return (
									<TabsTrigger className="min-h-9 px-2.5 py-2" key={tab.value} value={tab.value}>
										<Icon />
										{tab.label}
									</TabsTrigger>
								)
							})}
						</TabsList>

						<TabsContent className="min-w-0 w-full" value="profile">
							<ProfileSettings />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</>
	)
}
