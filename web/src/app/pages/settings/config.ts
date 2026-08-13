import { Bell, Settings2, Shield, Tags, UserRound } from 'lucide-react'

export const SETTINGS_TABS = [
	{
		value: 'profile',
		label: 'Account',
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
		value: 'categories',
		label: 'Categories',
		icon: Tags,
		keywords: ['categories', 'colors', 'plans', 'work logs'],
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
