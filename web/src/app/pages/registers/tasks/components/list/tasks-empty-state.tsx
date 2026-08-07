import { ListChecks, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ITasksEmptyStateProps {
	/** Nothing matched vs. nothing exists — different problems, different exits. */
	filtered: boolean
	onClearFilters: () => void
	onNewTask: () => void
}

export function TasksEmptyState({ filtered, onClearFilters, onNewTask }: ITasksEmptyStateProps) {
	const Icon = filtered ? SearchX : ListChecks

	return (
		<div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
			<div className="flex size-10 items-center justify-center rounded-md bg-muted">
				<Icon className="size-5 text-muted-foreground" />
			</div>

			<div className="space-y-1">
				<p className="font-medium">{filtered ? 'No tasks match the filters' : 'No tasks yet'}</p>

				<p className="text-sm text-muted-foreground">
					{filtered
						? 'Try a different search term, or widen the status and priority filters.'
						: 'Create the first task to start planning your work.'}
				</p>
			</div>

			{filtered ? (
				<Button variant="outline" size="sm" onClick={onClearFilters}>
					Clear filters
				</Button>
			) : (
				<Button size="sm" onClick={onNewTask}>
					New task
				</Button>
			)}
		</div>
	)
}
