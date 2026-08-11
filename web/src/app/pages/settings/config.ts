import { Bell, Clock3, Languages, ShieldCheck, UserRound } from 'lucide-react'

export const SETTINGS_TABS = [
	{
		value: 'profile',
		label: 'Profile',
		icon: UserRound,
	},
	{
		value: 'security',
		label: 'Security',
		icon: ShieldCheck,
	},
	{
		value: 'work-preferences',
		label: 'Work preferences',
		icon: Clock3,
	},
	{
		value: 'notifications',
		label: 'Notifications',
		icon: Bell,
	},
	{
		value: 'appearance-language',
		label: 'Appearance & language',
		icon: Languages,
	},
] as const

export type TSettingsTab = (typeof SETTINGS_TABS)[number]['value']

export const SETTINGS_TAB_VALUES = SETTINGS_TABS.map((tab) => tab.value) as readonly TSettingsTab[]
