import {
	endOfMonth,
	endOfWeek,
	startOfMonth,
	startOfWeek,
	subMonths,
	subWeeks,
} from 'date-fns'
import { ChevronDown, Download, FileSpreadsheet, FileText, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import type { DateRange } from 'react-day-picker'

import {
	DateRangePicker,
	type IDateRangePreset,
} from '@/components/date-range-picker'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { WEEK_STARTS_ON } from '@/features/calendar/constants'
import { CategoryFilter } from '@/features/categories/components/category-filter'
import type { ICategory } from '@/features/categories/model/category-types'
import type { Task } from '@/features/tasks/model/task-types'

import type {
	TWorkLogReportColumn,
	TWorkLogReportGroup,
} from '../model/work-log-report'
import { ReportColumnsMenu } from './report-columns-menu'
import { ReportTaskFilter } from './report-task-filter'

type TReportExportFormat = 'xlsx' | 'csv'

interface IWorkLogReportToolbarProps {
	range: DateRange | undefined
	tasks: Task[]
	categories: ICategory[]
	selectedTaskIds: string[]
	selectedCategoryIds: string[]
	groupBy: TWorkLogReportGroup
	selectedColumns: TWorkLogReportColumn[]
	canReset: boolean
	exportDisabled: boolean
	onRangeChange: (range: DateRange | undefined) => void
	onToggleTask: (taskId: string) => void
	onClearTasks: () => void
	onToggleCategory: (categoryId: string) => void
	onClearCategories: () => void
	onGroupChange: (group: TWorkLogReportGroup) => void
	onToggleColumn: (column: TWorkLogReportColumn) => void
	onSelectAllColumns: () => void
	onResetColumns: () => void
	onReset: () => void
	onExport: (format: TReportExportFormat) => void
}

export function WorkLogReportToolbar({
	range,
	tasks,
	categories,
	selectedTaskIds,
	selectedCategoryIds,
	groupBy,
	selectedColumns,
	canReset,
	exportDisabled,
	onRangeChange,
	onToggleTask,
	onClearTasks,
	onToggleCategory,
	onClearCategories,
	onGroupChange,
	onToggleColumn,
	onSelectAllColumns,
	onResetColumns,
	onReset,
	onExport,
}: IWorkLogReportToolbarProps) {
	const presets = useMemo<IDateRangePreset[]>(() => {
		const today = new Date()
		const weekOptions = { weekStartsOn: WEEK_STARTS_ON } as const
		const previousWeek = subWeeks(today, 1)
		const previousMonth = subMonths(today, 1)

		return [
			{
				label: 'This week',
				value: {
					from: startOfWeek(today, weekOptions),
					to: endOfWeek(today, weekOptions),
				},
			},
			{
				label: 'Last week',
				value: {
					from: startOfWeek(previousWeek, weekOptions),
					to: endOfWeek(previousWeek, weekOptions),
				},
			},
			{
				label: 'This month',
				value: { from: startOfMonth(today), to: endOfMonth(today) },
			},
			{
				label: 'Last month',
				value: { from: startOfMonth(previousMonth), to: endOfMonth(previousMonth) },
			},
		]
	}, [])

	return (
		<div className="flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<div className="w-full sm:w-auto">
				<DateRangePicker
					value={range}
					onValueChange={onRangeChange}
					label="Report period"
					presets={presets}
				/>
			</div>

			<ReportTaskFilter
				tasks={tasks}
				selectedTaskIds={selectedTaskIds}
				onToggle={onToggleTask}
				onClear={onClearTasks}
			/>

			<CategoryFilter
				categories={categories}
				selectedCategoryIds={selectedCategoryIds}
				onToggle={onToggleCategory}
				onClear={onClearCategories}
			/>

			<Select
				value={groupBy}
				onValueChange={(value) => value && onGroupChange(value as TWorkLogReportGroup)}
			>
				<SelectTrigger size="sm" aria-label="Group report by">
					<span className="text-muted-foreground">Group</span>
					<SelectValue />
				</SelectTrigger>
				<SelectContent align="start">
					<SelectItem value="day">Day</SelectItem>
					<SelectItem value="task">Task</SelectItem>
					<SelectItem value="none">None</SelectItem>
				</SelectContent>
			</Select>

			<ReportColumnsMenu
				selectedColumns={selectedColumns}
				onToggle={onToggleColumn}
				onSelectAll={onSelectAllColumns}
				onReset={onResetColumns}
			/>

			<Button
				type="button"
				variant="ghost"
				size="sm"
				disabled={!canReset}
				onClick={onReset}
			>
				<RotateCcw />
				Reset
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger
					render={<Button size="sm" className="ml-auto" disabled={exportDisabled} />}
				>
					<Download />
					Export
					<ChevronDown />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-52">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Export report</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => onExport('xlsx')}>
							<FileSpreadsheet />
							Export Excel (.xlsx)
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onExport('csv')}>
							<FileText />
							Export CSV (.csv)
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}

export type { TReportExportFormat }
