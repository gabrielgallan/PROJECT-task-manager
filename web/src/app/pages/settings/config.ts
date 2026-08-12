import { Bell, Settings2, Shield, UserRound } from 'lucide-react'

export const SETTINGS_TABS = [
	{
		value: 'profile',
		label: 'Profile',
		icon: UserRound,
		keywords: ['account', 'user', 'name', 'email', 'avatar'],
	},
	{
		value: 'notifications',
		label: 'Notifications',
		icon: Bell,
		keywords: ['alerts', 'reminders', 'channels', 'summary'],
	},
	{
		value: 'security',
		label: 'Security',
		icon: Shield,
		keywords: ['password', 'sessions', 'access'],
	},
	{
		value: 'system',
		label: 'System',
		icon: Settings2,
		keywords: ['theme', 'language', 'timezone', 'appearance'],
	},
] as const

export type TSettingsTab = (typeof SETTINGS_TABS)[number]['value']

export const SETTINGS_TAB_VALUES = SETTINGS_TABS.map((tab) => tab.value) as readonly TSettingsTab[]
