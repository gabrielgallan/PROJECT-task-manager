import { BriefcaseBusiness, CalendarDays, Clock3, FileClock, Unlink } from 'lucide-react'

import type { IWorkLogReportSummary } from '../model/work-log-report'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'

interface IWorkLogReportSummaryProps {
	summary: IWorkLogReportSummary
}

const SUMMARY_ITEMS = [
	{
		key: 'total',
		label: 'Logged',
		icon: Clock3,
		tone: 'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
	},
	{
		key: 'logs',
		label: 'Work logs',
		icon: FileClock,
		tone: 'bg-sky-500/12 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
	},
	{
		key: 'days',
		label: 'Active days',
		icon: CalendarDays,
		tone: 'bg-violet-500/12 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
	},
	{
		key: 'tasks',
		label: 'Tasks',
		icon: BriefcaseBusiness,
		tone: 'bg-amber-500/14 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
	},
	{
		key: 'unassigned',
		label: 'Without task',
		icon: Unlink,
		tone: 'bg-rose-500/12 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
	},
] as const

export function WorkLogReportSummary({ summary }: IWorkLogReportSummaryProps) {
	const values = {
		total: formatMinutes(summary.totalMinutes),
		logs: summary.workLogCount.toLocaleString(),
		days: summary.activeDayCount.toLocaleString(),
		tasks: summary.taskCount.toLocaleString(),
		unassigned: formatMinutes(summary.unassignedMinutes),
	}

	return (
		<dl className="grid shrink-0 grid-cols-2 gap-y-4 py-1 sm:grid-cols-5 sm:divide-x sm:divide-border/70 sm:gap-y-0">
			{SUMMARY_ITEMS.map((item) => {
				const Icon = item.icon
				return (
					<div
						key={item.key}
						className="flex min-w-0 items-center gap-3 px-3 even:border-l even:border-border/70 sm:border-l-0 sm:px-5 sm:even:border-l-0 sm:first:pl-0 sm:last:pr-0"
					>
						<div
							className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
						>
							<Icon className="size-4" />
						</div>
						<div className="min-w-0">
							<dt className="truncate text-xs text-muted-foreground">{item.label}</dt>
							<dd className="truncate text-sm font-semibold tabular-nums">
								{values[item.key]}
							</dd>
						</div>
					</div>
				)
			})}
		</dl>
	)
}
