import { Trash2 } from 'lucide-react'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Task } from '@/features/tasks/model/task-types'

interface IDeleteTaskDialogProps {
	task: Task | null
	onOpenChange: (open: boolean) => void
	onConfirm: (task: Task) => void
}

export function DeleteTaskDialog({ task, onOpenChange, onConfirm }: IDeleteTaskDialogProps) {
	return (
		<AlertDialog open={Boolean(task)} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia>
						<Trash2 className="text-destructive" />
					</AlertDialogMedia>

					<AlertDialogTitle>Delete task</AlertDialogTitle>

					<AlertDialogDescription>
						“{task?.title}” will be removed. Plans and work logs pointing to it are kept.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>

					<AlertDialogAction
						variant="destructive"
						onClick={() => {
							if (task) {
								onConfirm(task)
							}
						}}
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
