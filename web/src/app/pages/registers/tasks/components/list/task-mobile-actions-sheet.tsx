import { PanelRight, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet'
import type { Task } from '@/features/tasks/model/task-types'

interface ITaskMobileActionsSheetProps {
	task: Task | null
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function TaskMobileActionsSheet({ task, open, onOpenChange }: ITaskMobileActionsSheetProps) {
	if (!task) return null

	const close = () => onOpenChange(false)

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="bottom" className="gap-0 rounded-t-xl pb-2">
				<SheetHeader className="pr-12 pb-3">
					<SheetTitle className="truncate">{task.title}</SheetTitle>
					<SheetDescription>Choose an action for this task.</SheetDescription>
				</SheetHeader>

				<div className="grid gap-1 px-2">
					<Button variant="ghost" className="h-11 w-full justify-start px-3" onClick={close}>
						<PanelRight />
						Details
					</Button>

					<Button variant="ghost" className="h-11 w-full justify-start px-3" onClick={close}>
						<Pencil />
						Edit
					</Button>

					<Button variant="destructive" className="h-11 w-full justify-start px-3" onClick={close}>
						<Trash2 />
						Delete
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	)
}
