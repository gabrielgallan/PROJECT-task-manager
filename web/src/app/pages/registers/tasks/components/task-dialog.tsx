import { CalendarIcon, X } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTaskForm } from '@/features/tasks/hooks/use-task-form'
import { localToTaskDate, taskDateToLocal } from '@/features/tasks/model/task-dates'
import { TASK_PRIORITIES, TASK_PRIORITY_COLOR, TASK_PRIORITY_LABEL } from '@/features/tasks/model/task-priority'
import { TASK_STATUS_ICON, TASK_STATUS_ICON_COLOR, TASK_STATUS_LABEL, TASK_STATUSES } from '@/features/tasks/model/task-status'
import type { Task, TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'
import { cn } from '@/lib/utils'

interface DateFieldProps {
	id: string; label: string; placeholder: string; description?: string
	value: string | null; onChange: (date: string | null) => void; onBlur: () => void
	invalid: boolean; error?: string; disabled: boolean
}
function DateField({ id, label, placeholder, description, value, onChange, onBlur, invalid, error, disabled }: DateFieldProps) {
	const date = taskDateToLocal(value)
	const errorId = `${id}-error`
	return <Field data-invalid={invalid}>
		<FieldLabel htmlFor={id}>{label}</FieldLabel>
		<div className="flex gap-1">
			<Popover>
				<PopoverTrigger render={<Button id={id} type="button" variant="outline" className="w-full justify-between font-normal" disabled={disabled} aria-invalid={invalid} aria-describedby={error ? errorId : undefined} onBlur={onBlur} />}>
					<span className={cn(!date && 'text-muted-foreground')}>{date ? date.toLocaleDateString(undefined, { dateStyle: 'long' }) : placeholder}</span>
					<CalendarIcon className="size-4 text-muted-foreground" />
				</PopoverTrigger>
				<PopoverContent align="start" className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(selected) => onChange(localToTaskDate(selected))} autoFocus /></PopoverContent>
			</Popover>
			{value && <Button type="button" variant="ghost" size="icon" disabled={disabled} onClick={() => onChange(null)} aria-label={`Clear ${label.toLowerCase()}`}><X /></Button>}
		</div>
		{description && <FieldDescription>{description}</FieldDescription>}
		{error && <p id={errorId} className="text-sm text-destructive">{error}</p>}
	</Field>
}

export function TaskDialog({ task, open, onOpenChange }: { task?: Task; open: boolean; onOpenChange: (open: boolean) => void }) {
	if (!open) return null
	return <TaskFormDialog key={task?.id ?? 'create'} task={task} onClose={() => onOpenChange(false)} />
}
function TaskFormDialog({ task, onClose }: { task?: Task; onClose: () => void }) {
	const { form, onSubmit, close, error, pending, disabled, unavailable, hasChanges } = useTaskForm(task, onClose)
	const { register, control, formState: { errors } } = form
	return <Dialog open onOpenChange={(next) => !next && close()}>
		<DialogContent className="sm:max-w-lg" showCloseButton={!disabled}>
			<DialogHeader><DialogTitle>{task ? 'Edit task' : 'New task'}</DialogTitle></DialogHeader>
			<form id="task-form" onSubmit={onSubmit} noValidate className="space-y-4">
				{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
				<fieldset disabled={disabled || unavailable}><FieldGroup>
					<Field data-invalid={!!errors.title}>
						<FieldLabel htmlFor="task-title">Title</FieldLabel>
						<Input id="task-title" placeholder="What needs to be done?" aria-invalid={!!errors.title} aria-describedby={errors.title ? 'task-title-error' : undefined} {...register('title')} />
						{errors.title && <p id="task-title-error" className="text-sm text-destructive">{errors.title.message}</p>}
					</Field>
					<div className="grid gap-4 sm:grid-cols-2">
						<Controller control={control} name="status" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="task-status">Status</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange} disabled={disabled || unavailable}>
								<SelectTrigger id="task-status" className="w-full" aria-invalid={fieldState.invalid} aria-describedby={fieldState.error ? 'task-status-error' : undefined} ref={field.ref} onBlur={field.onBlur}><SelectValue>{(value: TaskStatus) => { const Icon = TASK_STATUS_ICON[value]; return <span className="flex items-center gap-2"><Icon className={cn('size-3', TASK_STATUS_ICON_COLOR[value])} />{TASK_STATUS_LABEL[value]}</span> }}</SelectValue></SelectTrigger>
								<SelectContent>{TASK_STATUSES.map((status) => { const Icon = TASK_STATUS_ICON[status]; return <SelectItem key={status} value={status}><span className="flex items-center gap-2"><Icon className={cn('size-3', TASK_STATUS_ICON_COLOR[status])} />{TASK_STATUS_LABEL[status]}</span></SelectItem> })}</SelectContent>
							</Select>
							{fieldState.error && <p id="task-status-error" className="text-sm text-destructive">{fieldState.error.message}</p>}
						</Field>} />
						<Controller control={control} name="priority" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="task-priority">Priority</FieldLabel>
							<Select value={field.value} onValueChange={field.onChange} disabled={disabled || unavailable}>
								<SelectTrigger id="task-priority" className="w-full" aria-invalid={fieldState.invalid} aria-describedby={fieldState.error ? 'task-priority-error' : undefined} ref={field.ref} onBlur={field.onBlur}><SelectValue>{(value: TaskPriority) => <span className="flex items-center gap-2"><span className={cn('block size-1.5 rounded-xs', TASK_PRIORITY_COLOR[value])} />{TASK_PRIORITY_LABEL[value]}</span>}</SelectValue></SelectTrigger>
								<SelectContent>{TASK_PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}><span className="flex items-center gap-2"><span className={cn('block size-1.5 rounded-xs', TASK_PRIORITY_COLOR[priority])} />{TASK_PRIORITY_LABEL[priority]}</span></SelectItem>)}</SelectContent>
							</Select>
							{fieldState.error && <p id="task-priority-error" className="text-sm text-destructive">{fieldState.error.message}</p>}
						</Field>} />
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<Controller control={control} name="startDate" render={({ field, fieldState }) => <DateField id="task-start-date" label="Start date" placeholder="Not planned" value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={fieldState.invalid} error={fieldState.error?.message} disabled={disabled || unavailable} />} />
						<Controller control={control} name="dueDate" render={({ field, fieldState }) => <DateField id="task-due-date" label="Due date" placeholder="No deadline" description="Tasks without a due date stay out of the timeline." value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={fieldState.invalid} error={fieldState.error?.message} disabled={disabled || unavailable} />} />
					</div>
					<Field data-invalid={!!errors.description}>
						<FieldLabel htmlFor="task-description">Description</FieldLabel>
						<Textarea id="task-description" placeholder="Optional notes" aria-invalid={!!errors.description} aria-describedby={errors.description ? 'task-description-error' : undefined} {...register('description')} />
						{errors.description && <p id="task-description-error" className="text-sm text-destructive">{errors.description.message}</p>}
					</Field>
				</FieldGroup></fieldset>
			</form>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={close} disabled={disabled}>{unavailable ? 'Close' : 'Cancel'}</Button>
				<Button form="task-form" type="submit" disabled={disabled || unavailable || !hasChanges}>{pending ? (task ? 'Saving…' : 'Creating…') : task ? 'Save' : 'Create'}</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
}
