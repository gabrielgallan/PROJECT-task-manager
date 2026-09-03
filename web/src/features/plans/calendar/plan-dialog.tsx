import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CategoryCombobox } from '@/features/categories/components/category-combobox'
import type { ICategory } from '@/features/categories/model/category-types'
import { planSchema, type TPlanFormData } from '@/features/plans/model/plan-schema'
import type { IPlan, TPlanDialogState } from '@/features/plans/model/plan-types'
import { TaskCombobox } from '@/features/tasks/components/task-combobox'
import type { Task } from '@/features/tasks/model/task-types'

const EMPTY_VALUES: TPlanFormData = {
	title: '',
	description: '',
	startDate: new Date(),
	endDate: new Date(),
	taskId: null,
	categoryId: null,
}

interface IPlanDialogProps {
	state: TPlanDialogState
	tasks: Task[]
	categories: ICategory[]
	use24HourFormat: boolean
	onClose: () => void
	onCreate: (plan: IPlan) => void
	onUpdate: (plan: IPlan) => void
	onDelete: (plan: IPlan) => void
	/** Optional: without it, plans work on their own with no work log in sight. */
	onConfirm?: (plan: IPlan) => void
}

export function PlanDialog({
	state,
	tasks,
	categories,
	use24HourFormat,
	onClose,
	onCreate,
	onUpdate,
	onDelete,
	onConfirm,
}: IPlanDialogProps) {
	const isOpen = state.mode !== 'closed'
	const isEditing = state.mode === 'edit'
	const editingPlan = state.mode === 'edit' ? state.plan : null

	// A plan that has not happened yet cannot be recorded as work already done.
	const confirmBlockedReason = editingPlan?.confirmedAt
		? 'Already recorded as a work log'
		: editingPlan && new Date(editingPlan.endDate) > new Date()
			? 'Only past plans can be recorded'
			: null
	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<TPlanFormData>({
		resolver: zodResolver(planSchema),
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
				title: state.plan.title,
				description: state.plan.description ?? '',
				startDate: new Date(state.plan.startDate),
				endDate: new Date(state.plan.endDate),
				taskId: state.plan.taskId ?? null,
				categoryId: state.plan.categoryId ?? null,
			})
		}
	}, [state, reset])

	const onSubmit = (values: TPlanFormData) => {
		const plan: IPlan = {
			id: state.mode === 'edit' ? state.plan.id : crypto.randomUUID(),
			title: values.title,
			description: values.description?.trim() ? values.description : undefined,
			startDate: values.startDate.toISOString(),
			endDate: values.endDate.toISOString(),
			taskId: values.taskId ?? null,
			categoryId: values.categoryId ?? null,
			confirmedAt: state.mode === 'edit' ? state.plan.confirmedAt : null,
		}

		if (state.mode === 'edit') onUpdate(plan)
		else onCreate(plan)
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit plan' : 'New plan'}</DialogTitle>
				</DialogHeader>

				<form id="plan-form" onSubmit={handleSubmit(onSubmit)} noValidate>
					<FieldGroup>
						<Field data-invalid={!!errors.title}>
							<FieldLabel htmlFor="plan-title">Title</FieldLabel>
							<Input
								id="plan-title"
								placeholder="What are you going to work on?"
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
										id="plan-start"
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
										id="plan-end"
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
									<FieldLabel htmlFor="plan-task">Task</FieldLabel>
									<TaskCombobox
										id="plan-task"
										selectedLabel={tasks.find((task) => task.id === field.value)?.title}
										value={field.value ?? null}
										onChange={field.onChange}
										onBlur={field.onBlur}
										invalid={fieldState.invalid}
									/>
									<FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
								</Field>
							)}
						/>

						<Controller
							control={control}
							name="categoryId"
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="plan-category">Category</FieldLabel>
									<CategoryCombobox
										id="plan-category"
										categories={categories}
										value={field.value ?? null}
										onChange={field.onChange}
										onBlur={field.onBlur}
										invalid={fieldState.invalid}
									/>
									<FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
								</Field>
							)}
						/>

						<Field>
							<FieldLabel htmlFor="plan-description">Description</FieldLabel>
							<Textarea
								id="plan-description"
								placeholder="Optional notes"
								{...register('description')}
							/>
						</Field>
					</FieldGroup>
				</form>

				<DialogFooter className="sm:justify-between">
					{editingPlan ? (
						<div className="flex gap-2">
							<Button type="button" variant="destructive" onClick={() => onDelete(editingPlan)}>
								<Trash2 />
								Delete
							</Button>

							{onConfirm && (
								<Tooltip>
									{/* A disabled button emits no pointer events, so the wrapper is what
									    the tooltip listens to — otherwise the reason never shows. */}
									<TooltipTrigger render={<span tabIndex={confirmBlockedReason ? 0 : -1} />}>
										<Button
											type="button"
											variant="outline"
											disabled={!!confirmBlockedReason}
											onClick={() => onConfirm(editingPlan)}
										>
											<CircleCheck />
											{editingPlan.confirmedAt ? 'Recorded' : 'Record as done'}
										</Button>
									</TooltipTrigger>

									{confirmBlockedReason && <TooltipContent>{confirmBlockedReason}</TooltipContent>}
								</Tooltip>
							)}
						</div>
					) : (
						<span />
					)}

					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button form="plan-form" type="submit">
							{isEditing ? 'Save' : 'Create'}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
