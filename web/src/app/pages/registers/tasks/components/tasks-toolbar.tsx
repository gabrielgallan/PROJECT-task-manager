import { Plus, Search, X } from 'lucide-react'
import type { FormEvent, KeyboardEvent } from 'react'
import {
	type IFacetOption,
	TaskFacetFilter,
} from '@/app/pages/registers/tasks/components/task-facet-filter'
import { PageViewTabs } from '@/components/page-view-tabs'
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
import type { ITaskFilters } from '@/features/tasks/model/task-query'
import {
	TASK_STATUS_ICON,
	TASK_STATUS_ICON_COLOR,
	TASK_STATUS_LABEL,
	TASK_STATUSES,
} from '@/features/tasks/model/task-status'
import type { TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'
import { TASK_VIEWS, type TTaskView } from '@/features/tasks/model/task-views'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

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
	draft: ITaskFilters
	isDirty: boolean
	canClear: boolean
	view: TTaskView
	onViewChange: (view: TTaskView) => void
	onSearchChange: (search: string) => void
	onToggleStatus: (status: TaskStatus) => void
	onTogglePriority: (priority: TaskPriority) => void
	onClearStatus: () => void
	onClearPriority: () => void
	onApply: () => void
	onClearAll: () => void
	onNewTask: () => void
}

export function TasksToolbar({
	draft,
	isDirty,
	canClear,
	view,
	onViewChange,
	onSearchChange,
	onToggleStatus,
	onTogglePriority,
	onClearStatus,
	onClearPriority,
	onApply,
	onClearAll,
	onNewTask,
}: ITasksToolbarProps) {
	const isMobile = useIsMobile()

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault()
		onApply()
	}

	// The underlying input does not take part in implicit submission, so Enter is
	// wired by hand — typing a term and pressing it has to search.
	const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			event.preventDefault()
			onApply()
		}
	}

	return (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<form className="flex flex-wrap items-center gap-2" onSubmit={handleSubmit}>
				<InputGroup className="w-full sm:w-64">
					<InputGroupAddon>
						<Search />
					</InputGroupAddon>

					<InputGroupInput
						aria-label="Search tasks"
						placeholder="Search tasks..."
						value={draft.search}
						onChange={(event) => onSearchChange(event.target.value)}
						onKeyDown={handleSearchKeyDown}
					/>

					{draft.search && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								type="button"
								size="icon-xs"
								aria-label="Clear search"
								onClick={() => onSearchChange('')}
							>
								<X />
							</InputGroupButton>
						</InputGroupAddon>
					)}
				</InputGroup>

				<TaskFacetFilter
					label="Status"
					options={STATUS_OPTIONS}
					selected={draft.status}
					onToggle={onToggleStatus}
					onClear={onClearStatus}
				/>

				<TaskFacetFilter
					label="Priority"
					options={PRIORITY_OPTIONS}
					selected={draft.priority}
					onToggle={onTogglePriority}
					onClear={onClearPriority}
				/>

				{/* Filled while there is something pending, so an edited but unapplied
				    filter never passes for an applied one. */}
				<Button
					type="submit"
					size={isMobile ? 'icon' : 'sm'}
					variant={isDirty ? 'default' : 'outline'}
				>
					<Search />
					{!isMobile && 'Search'}
				</Button>

				{/* Kept in place rather than toggled, so the pair never shifts around. */}
				<Button
					type="button"
					variant="ghost"
					size={isMobile ? 'icon' : 'sm'}
					disabled={!canClear}
					onClick={onClearAll}
				>
					<X />
					{!isMobile && 'Clear filters'}
				</Button>
			</form>

			{/* Views and the main action share the right side, as in the calendar pages. */}
			<div className="flex ml-auto items-center gap-2">
				<PageViewTabs views={TASK_VIEWS} value={view} onChange={onViewChange} />

				<Button onClick={onNewTask} size={isMobile ? 'icon' : 'sm'}>
					<Plus />
					{!isMobile && 'New task'}
				</Button>
			</div>
		</div>
	)
}
