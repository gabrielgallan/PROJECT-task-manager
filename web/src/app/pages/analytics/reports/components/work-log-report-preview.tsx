import { CalendarRange, Clock3, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'
import { cn } from '@/lib/utils'

import {
	type IWorkLogReportResult,
	type IWorkLogReportRow,
	type TWorkLogReportColumn,
	type TWorkLogReportGroup,
	WORK_LOG_REPORT_COLUMNS,
} from '../model/work-log-report'

interface IWorkLogReportPreviewProps {
	report: IWorkLogReportResult
	columns: TWorkLogReportColumn[]
	groupBy: TWorkLogReportGroup
	isRangeComplete: boolean
	allWorkLogCount: number
	onClearFilters: () => void
}

interface IReportEmptyStateProps {
	icon: typeof Clock3
	title: string
	description: string
	action?: ReactNode
}

function ReportEmptyState({ icon: Icon, title, description, action }: IReportEmptyStateProps) {
	return (
		<div className="flex min-h-80 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
			<div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
				<Icon className="size-5" />
			</div>
			<h3 className="text-sm font-semibold">{title}</h3>
			<p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
			{action && <div className="mt-4">{action}</div>}
		</div>
	)
}

function TruncatedValue({ value, className }: { value: string; className?: string }) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={<span tabIndex={0} className={cn('block truncate outline-none', className)} />}
			>
				{value}
			</TooltipTrigger>
			<TooltipContent>{value}</TooltipContent>
		</Tooltip>
	)
}

function renderCell(row: IWorkLogReportRow, column: TWorkLogReportColumn) {
	switch (column) {
		case 'date':
			return format(row.startDate, 'MMM d, yyyy')
		case 'start':
			return format(row.startDate, 'p')
		case 'end':
			return format(row.endDate, 'p')
		case 'duration':
			return formatMinutes(row.durationMinutes)
		case 'task':
			return <TruncatedValue value={row.taskLabel} className="max-w-52" />
		case 'title':
			return <TruncatedValue value={row.workLog.title} className="max-w-64 font-medium" />
		case 'description':
			return row.workLog.description ? (
				<TruncatedValue value={row.workLog.description} className="max-w-80" />
			) : (
				<span className="text-muted-foreground">—</span>
			)
	}
}

function getColumnClassName(column: TWorkLogReportColumn) {
	if (column === 'duration' || column === 'start' || column === 'end') {
		return 'text-right tabular-nums'
	}
	if (column === 'date') return 'tabular-nums'
	return undefined
}

export function WorkLogReportPreview({
	report,
	columns,
	groupBy,
	isRangeComplete,
	allWorkLogCount,
	onClearFilters,
}: IWorkLogReportPreviewProps) {
	const visibleColumns = WORK_LOG_REPORT_COLUMNS.filter((column) =>
		columns.includes(column.value),
	)

	let content: ReactNode

	if (allWorkLogCount === 0) {
		content = (
			<ReportEmptyState
				icon={Clock3}
				title="No work logs yet"
				description="Recorded work will appear here so you can review where your time went and prepare an export."
			/>
		)
	} else if (!isRangeComplete) {
		content = (
			<ReportEmptyState
				icon={CalendarRange}
				title="Complete the report period"
				description="Choose both a start and end date to calculate the summary and preview your report."
			/>
		)
	} else if (report.rows.length === 0) {
		content = (
			<ReportEmptyState
				icon={SearchX}
				title="No matching work logs"
				description="There are no records for this period and task selection. Try a broader period or clear the filters."
				action={
					<Button variant="outline" size="sm" onClick={onClearFilters}>
						Clear filters
					</Button>
				}
			/>
		)
	} else {
		content = (
			<div className="min-h-0 flex-1 overflow-auto">
				<Table containerClassName="overflow-visible" className="min-w-max">
					<TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)]">
						<TableRow className="hover:bg-transparent">
							{visibleColumns.map((column) => (
								<TableHead
									key={column.value}
									className={cn(
										'px-3 text-xs text-muted-foreground',
										getColumnClassName(column.value),
									)}
								>
									{column.label}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>

					<TableBody>
						{report.groups.map((group) => (
							<Fragment key={group.key}>
								{groupBy !== 'none' && (
									<TableRow className="bg-muted/60 hover:bg-muted/60">
										<TableCell colSpan={visibleColumns.length} className="px-3 py-2">
											<div className="flex items-center justify-between gap-4">
												<span className="font-medium">{group.label}</span>
												<span className="text-xs text-muted-foreground tabular-nums">
													{group.rows.length}{' '}
													{group.rows.length === 1 ? 'log' : 'logs'} ·{' '}
													{formatMinutes(group.totalMinutes)}
												</span>
											</div>
										</TableCell>
									</TableRow>
								)}

								{group.rows.map((row) => (
									<TableRow key={row.workLog.id}>
										{visibleColumns.map((column) => (
											<TableCell
												key={column.value}
												className={cn(
													'px-3 text-sm',
													getColumnClassName(column.value),
												)}
											>
												{renderCell(row, column.value)}
											</TableCell>
										))}
									</TableRow>
								))}
							</Fragment>
						))}
					</TableBody>

					<TableFooter>
						<TableRow>
							<TableCell colSpan={visibleColumns.length} className="px-3 py-2.5">
								<div className="flex items-center justify-between gap-4">
									<span>
										{report.rows.length} Work {report.rows.length === 1 ? 'Log' : 'Logs'}
									</span>
									<span className="tabular-nums">
										Total {formatMinutes(report.summary.totalMinutes)}
									</span>
								</div>
							</TableCell>
						</TableRow>
					</TableFooter>
				</Table>
			</div>
		)
	}

	return (
		<section
			aria-label="Report preview"
			className="flex min-h-96 flex-1 flex-col overflow-hidden rounded-xl border bg-card"
		>
			{content}
		</section>
	)
}
