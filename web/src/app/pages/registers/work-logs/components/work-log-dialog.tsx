import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { DateTimePicker } from '@/components/date-time-picker'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { ICalendarRange } from '@/features/calendar/types'
import type { Task } from '@/features/tasks/model/task-types'
import { type TWorkLogFormData, workLogSchema } from '@/features/work-logs/model/work-log-schema'
import type { IWorkLog, TWorkLogDialogState } from '@/features/work-logs/model/work-log-types'

const NO_TASK_VALUE = 'none'

const EMPTY_VALUES: TWorkLogFormData = {
	title: '',
	description: '',
	startDate: new Date(),
	endDate: new Date(),
	taskId: null,
}

interface IWorkLogDialogProps {
	state: TWorkLogDialogState
	tasks: Task[]
	use24HourFormat: boolean
	/** Returns why the range cannot be recorded, or null when it is valid. */
	validateRange: (range: ICalendarRange, ignoreId?: string) => string | null
	onClose: () => void
	onSubmit: (values: TWorkLogFormData, current: IWorkLog | null) => void
	onDelete: (workLog: IWorkLog) => void
}

export function WorkLogDialog({
	state,
	tasks,
	use24HourFormat,
	validateRange,
	onClose,
	onSubmit,
	onDelete,
}: IWorkLogDialogProps) {
	const isOpen = state.mode !== 'closed'
	const isEditing = state.mode === 'edit'
	const {
		control,
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm<TWorkLogFormData>({
		resolver: zodResolver(workLogSchema),
		defaultValues: EMPTY_VALUES,
	})

	useEffect(() => {
		if (state.mode === 'create') {
			reset({
				...EMPTY_VALUES,
				startDate: state.range.startDate,
				endDate: state.range.endDate,
			})
		} else if (state.mode === 'edit') {
			reset({
				title: state.workLog.title,
				description: state.workLog.description ?? '',
				startDate: new Date(state.workLog.startDate),
				endDate: new Date(state.workLog.endDate),
				taskId: state.workLog.taskId ?? null,
			})
		}
	}, [state, reset])

	const submit = (values: TWorkLogFormData) => {
		const current = state.mode === 'edit' ? state.workLog : null
		// Overlap needs the whole collection, so it is checked here and not in the schema.
		const message = validateRange(
			{ startDate: values.startDate, endDate: values.endDate },
			current?.id,
		)

		if (message) {
			setError('root', { message })
			return
		}

		onSubmit(values, current)
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit work log' : 'New work log'}</DialogTitle>
				</DialogHeader>

				<form id="work-log-form" onSubmit={handleSubmit(submit)} noValidate>
					<FieldGroup>
						<Field data-invalid={!!errors.title}>
							<FieldLabel htmlFor="work-log-title">Title</FieldLabel>
							<Input
								id="work-log-title"
								placeholder="What did you work on?"
								aria-invalid={!!errors.title}
								{...register('title')}
							/>
							<FieldError errors={errors.title ? [errors.title] : undefined} />
						</Field>

						<div className="grid gap-4 sm:grid-cols-2">
							<Controller
								control={control}
								name="startDate"
								render={({ field, fieldState }) => (
									<DateTimePicker
										id="work-log-start"
										label="Start"
										value={field.value}
										use24HourFormat={use24HourFormat}
										onChange={field.onChange}
										onBlur={field.onBlur}
										invalid={fieldState.invalid}
										error={fieldState.error?.message}
									/>
								)}
							/>

							<Controller
								control={control}
								name="endDate"
								render={({ field, fieldState }) => (
									<DateTimePicker
										id="work-log-end"
										label="End"
										value={field.value}
										use24HourFormat={use24HourFormat}
										onChange={field.onChange}
										onBlur={field.onBlur}
										invalid={fieldState.invalid}
										error={fieldState.error?.message}
									/>
								)}
							/>
						</div>

						<Controller
							control={control}
							name="taskId"
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="work-log-task">Task</FieldLabel>
									<Select
										value={field.value ?? NO_TASK_VALUE}
										onValueChange={(value) =>
											field.onChange(value === NO_TASK_VALUE ? null : value)
										}
									>
										<SelectTrigger
											id="work-log-task"
											className="w-full"
											aria-invalid={fieldState.invalid}
											onBlur={field.onBlur}
										>
											<SelectValue placeholder="No task" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={NO_TASK_VALUE}>No task</SelectItem>
											{tasks.map((task) => (
												<SelectItem key={task.id} value={task.id}>
													{task.title}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
								</Field>
							)}
						/>

						<Field>
							<FieldLabel htmlFor="work-log-description">Description</FieldLabel>
							<Textarea
								id="work-log-description"
								placeholder="Optional notes"
								{...register('description')}
							/>
						</Field>

						{errors.root?.message && <FieldError errors={[{ message: errors.root.message }]} />}
					</FieldGroup>
				</form>

				<DialogFooter className="sm:justify-between">
					{state.mode === 'edit' ? (
						<Button type="button" variant="destructive" onClick={() => onDelete(state.workLog)}>
							<Trash2 />
							Delete
						</Button>
					) : (
						<span />
					)}

					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button form="work-log-form" type="submit">
							{isEditing ? 'Save' : 'Create'}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
