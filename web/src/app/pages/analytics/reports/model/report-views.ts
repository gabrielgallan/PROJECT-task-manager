import { FileClock } from 'lucide-react'

import type { IViewOption } from '@/hooks/use-route-handle'

export const REPORT_VIEWS = [
	{ value: 'work-logs', label: 'Work logs', icon: FileClock },
] as const satisfies readonly IViewOption[]

export type TReportView = (typeof REPORT_VIEWS)[number]['value']
