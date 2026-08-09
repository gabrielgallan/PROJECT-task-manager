import { Columns3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
	DEFAULT_WORK_LOG_REPORT_COLUMNS,
	type TWorkLogReportColumn,
	WORK_LOG_REPORT_COLUMNS,
} from '../model/work-log-report'

interface IReportColumnsMenuProps {
	selectedColumns: TWorkLogReportColumn[]
	onToggle: (column: TWorkLogReportColumn) => void
	onSelectAll: () => void
	onReset: () => void
}

export function ReportColumnsMenu({
	selectedColumns,
	onToggle,
	onSelectAll,
	onReset,
}: IReportColumnsMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
				<Columns3 />
				Columns
				<Badge variant="secondary" className="ml-0.5">
					{selectedColumns.length}
				</Badge>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start" className="w-48">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Visible columns</DropdownMenuLabel>
					{WORK_LOG_REPORT_COLUMNS.map((column) => {
						const isSelected = selectedColumns.includes(column.value)
						const isLastSelected = isSelected && selectedColumns.length === 1

						return (
							<DropdownMenuCheckboxItem
								key={column.value}
								checked={isSelected}
								disabled={isLastSelected}
								closeOnClick={false}
								onCheckedChange={() => onToggle(column.value)}
							>
								{column.label}
							</DropdownMenuCheckboxItem>
						)
					})}
				</DropdownMenuGroup>

				<DropdownMenuSeparator />
				<DropdownMenuItem
					disabled={selectedColumns.length === WORK_LOG_REPORT_COLUMNS.length}
					onClick={onSelectAll}
				>
					Select all
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={
						selectedColumns.length === DEFAULT_WORK_LOG_REPORT_COLUMNS.length &&
						DEFAULT_WORK_LOG_REPORT_COLUMNS.every((column) =>
							selectedColumns.includes(column),
						)
					}
					onClick={onReset}
				>
					Reset columns
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
