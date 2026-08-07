import { useDebounce } from '@uidotdev/usehooks'
import { Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
	type IFacetOption,
	TaskFacetFilter,
} from '@/app/pages/registers/tasks/components/task-facet-filter'
import { Button } from '@/components/ui/button'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group'
import {
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_PRIORITY_LABEL,
} from '@/features/tasks/model/task-priority'
import { hasActiveTaskFilters, type ITaskQuery } from '@/features/tasks/model/task-query'
import {
	TASK_STATUS_ICON,
	TASK_STATUS_ICON_COLOR,
	TASK_STATUS_LABEL,
	TASK_STATUSES,
} from '@/features/tasks/model/task-status'
import type { TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

/** Long enough to swallow a burst of typing, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 250

const STATUS_OPTIONS: IFacetOption<TaskStatus>[] = TASK_STATUSES.map((status) => {
	const Icon = TASK_STATUS_ICON[status]

	return {
		value: status,
		label: TASK_STATUS_LABEL[status],
		icon: <Icon className={cn(['size-3', TASK_STATUS_ICON_COLOR[status]])} />,
	}
})

const PRIORITY_OPTIONS: IFacetOption<TaskPriority>[] = TASK_PRIORITIES.map((priority) => ({
	value: priority,
	label: TASK_PRIORITY_LABEL[priority],
	icon: <span className={cn(['block size-1.5 rounded-xs', TASK_PRIORITY_COLOR[priority]])} />,
}))

interface ITasksToolbarProps {
	query: ITaskQuery
	statusCounts: Record<string, number>
	priorityCounts: Record<string, number>
	onSearchChange: (search: string) => void
	onToggleStatus: (status: TaskStatus) => void
	onTogglePriority: (priority: TaskPriority) => void
	onClearStatus: () => void
	onClearPriority: () => void
	onClearFilters: () => void
	onNewTask: () => void
}

export function TasksToolbar({
	query,
	statusCounts,
	priorityCounts,
	onSearchChange,
	onToggleStatus,
	onTogglePriority,
	onClearStatus,
	onClearPriority,
	onClearFilters,
	onNewTask,
}: ITasksToolbarProps) {
	// The input stays instant while the URL only follows once typing settles.
	const [term, setTerm] = useState(query.search)
	const debouncedTerm = useDebounce(term, SEARCH_DEBOUNCE_MS)

	useEffect(() => {
		onSearchChange(debouncedTerm)
	}, [debouncedTerm, onSearchChange])

	// Clearing the filters elsewhere has to empty the box as well. It only runs
	// when the URL term actually changes, so it never fights the typing above.
	useEffect(() => {
		if (query.search === '') {
			setTerm('')
		}
	}, [query.search])

	const hasFilters = hasActiveTaskFilters(query)

	return (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<div className="flex flex-wrap items-center gap-2">
				<InputGroup className="w-full sm:w-64">
					<InputGroupAddon>
						<Search />
					</InputGroupAddon>

					<InputGroupInput
						aria-label="Search tasks"
						placeholder="Search tasks..."
						value={term}
						onChange={(event) => setTerm(event.target.value)}
					/>

					{term && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setTerm('')}>
								<X />
							</InputGroupButton>
						</InputGroupAddon>
					)}
				</InputGroup>

				<TaskFacetFilter
					label="Status"
					options={STATUS_OPTIONS}
					selected={query.status}
					counts={statusCounts}
					onToggle={onToggleStatus}
					onClear={onClearStatus}
				/>

				<TaskFacetFilter
					label="Priority"
					options={PRIORITY_OPTIONS}
					selected={query.priority}
					counts={priorityCounts}
					onToggle={onTogglePriority}
					onClear={onClearPriority}
				/>

				{/* Only offered when there is something to undo. */}
				{hasFilters && (
					<Button variant="ghost" size="sm" onClick={onClearFilters}>
						<X />
						Clear filters
					</Button>
				)}
			</div>

			<Button onClick={onNewTask}>
				<Plus />
				New task
			</Button>
		</div>
	)
}
