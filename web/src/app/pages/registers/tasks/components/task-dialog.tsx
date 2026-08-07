import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
	TASK_PRIORITIES,
	TASK_PRIORITY_COLOR,
	TASK_PRIORITY_LABEL,
} from '@/features/tasks/model/task-priority'
import {
	TASK_STATUS_ICON,
	TASK_STATUS_ICON_COLOR,
	TASK_STATUS_LABEL,
	TASK_STATUSES,
} from '@/features/tasks/model/task-status'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

interface IDateFieldProps {
	id: string
	label: string
	placeholder: string
	description?: string
	value?: Date
	onChange: (date: Date | undefined) => void
}

function DateField({ id, label, placeholder, description, value, onChange }: IDateFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>

			<Popover>
				<PopoverTrigger
					render={
						<Button id={id} variant="outline" className="w-full justify-between font-normal" />
					}
				>
					<span className={cn(!value && 'text-muted-foreground')}>
						{value ? format(value, 'PPP') : placeholder}
					</span>

					<CalendarIcon className="size-4 text-muted-foreground" />
				</PopoverTrigger>

				<PopoverContent align="start" className="w-auto p-0">
					<Calendar mode="single" selected={value} onSelect={onChange} autoFocus />
				</PopoverContent>
			</Popover>

			{description && <FieldDescription>{description}</FieldDescription>}
		</Field>
	)
}

interface ITaskFormProps {
	task?: Task
}

/**
 * Lives inside the popup on purpose: the dialog content unmounts when closed, so
 * every time it opens the fields are seeded again from the task being edited.
 */
function TaskForm({ task }: ITaskFormProps) {
	// Local only, so the layout can be explored. No submit behaviour yet.
	const [startDate, setStartDate] = useState<Date | undefined>(task?.startDate)
	const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate)

	return (
		<form id="task-form" noValidate>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="task-title">Title</FieldLabel>
					<Input
						id="task-title"
						placeholder="What needs to be done?"
						defaultValue={task?.title}
					/>
				</Field>

				<div className="grid gap-4 sm:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="task-status">Status</FieldLabel>
						<Select defaultValue={task?.status ?? 'backlog'}>
							<SelectTrigger id="task-status" className="w-full">
								<SelectValue>
									{(value: TaskStatus) => {
										const Icon = TASK_STATUS_ICON[value]

										return (
											<span className="flex items-center gap-2">
												<Icon className={cn(['size-3', TASK_STATUS_ICON_COLOR[value]])} />
												{TASK_STATUS_LABEL[value]}
											</span>
										)
									}}
								</SelectValue>
							</SelectTrigger>

							<SelectContent>
								{TASK_STATUSES.map((status) => {
									const Icon = TASK_STATUS_ICON[status]

									return (
										<SelectItem key={status} value={status}>
											<span className="flex items-center gap-2">
												<Icon className={cn(['size-3', TASK_STATUS_ICON_COLOR[status]])} />
												{TASK_STATUS_LABEL[status]}
											</span>
										</SelectItem>
									)
								})}
							</SelectContent>
						</Select>
					</Field>

					<Field>
						<FieldLabel htmlFor="task-priority">Priority</FieldLabel>
						<Select defaultValue={task?.priority ?? 'medium'}>
							<SelectTrigger id="task-priority" className="w-full">
								<SelectValue>
									{(value: TaskPriority) => (
										<span className="flex items-center gap-2">
											<span
												className={cn(['block size-1.5 rounded-xs', TASK_PRIORITY_COLOR[value]])}
											/>
											{TASK_PRIORITY_LABEL[value]}
										</span>
									)}
								</SelectValue>
							</SelectTrigger>

							<SelectContent>
								{TASK_PRIORITIES.map((priority) => (
									<SelectItem key={priority} value={priority}>
										<span className="flex items-center gap-2">
											<span
												className={cn([
													'block size-1.5 rounded-xs',
													TASK_PRIORITY_COLOR[priority],
												])}
											/>
											{TASK_PRIORITY_LABEL[priority]}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<DateField
						id="task-start-date"
						label="Start date"
						placeholder="Not planned"
						value={startDate}
						onChange={setStartDate}
					/>

					<DateField
						id="task-due-date"
						label="Due date"
						placeholder="No deadline"
						description="Tasks without a due date stay out of the timeline."
						value={dueDate}
						onChange={setDueDate}
					/>
				</div>

				<Field>
					<FieldLabel htmlFor="task-description">Description</FieldLabel>
					<Textarea
						id="task-description"
						placeholder="Optional notes"
						defaultValue={task?.description}
					/>
				</Field>
			</FieldGroup>
		</form>
	)
}

interface ITaskDialogProps {
	/** Absent means creating a new task. */
	task?: Task
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function TaskDialog({ task, open, onOpenChange }: ITaskDialogProps) {
	const isEditing = Boolean(task)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit task' : 'New task'}</DialogTitle>
				</DialogHeader>

				<TaskForm task={task} />

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>

					<Button type="button" onClick={() => onOpenChange(false)}>
						{isEditing ? 'Save changes' : 'Create task'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
