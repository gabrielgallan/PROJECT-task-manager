import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableHead } from '@/components/ui/table'
import type { ITaskQuery, TTaskSortField } from '@/features/tasks/model/task-query'
import { cn } from '@/lib/utils'

interface ITasksTableSortHeadProps {
	field: TTaskSortField
	label: string
	query: ITaskQuery
	onSort: (field: TTaskSortField) => void
	align?: 'left' | 'right'
	className?: string
}

export function TasksTableSortHead({
	field,
	label,
	query,
	onSort,
	align = 'left',
	className,
}: ITasksTableSortHeadProps) {
	const isActive = query.sortBy === field
	const isAscending = query.sortDir === 'asc'

	let Icon = ChevronsUpDown

	if (isActive) {
		Icon = isAscending ? ArrowUp : ArrowDown
	}

	return (
		<TableHead
			className={cn(['p-0', className])}
			aria-sort={isActive ? (isAscending ? 'ascending' : 'descending') : 'none'}
		>
			<Button
				variant="ghost"
				size="sm"
				className={cn([
					'group h-10 w-full rounded-none font-medium',
					align === 'right' ? 'flex-row-reverse justify-start pr-2' : 'justify-start pl-2',
				])}
				onClick={() => onSort(field)}
			>
				{label}

				{/* The inactive hint only shows on hover, so the header stays quiet. */}
				<Icon
					className={cn([
						'transition-opacity',
						isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
					])}
				/>
			</Button>
		</TableHead>
	)
}
