import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { DateTimePicker } from '@/components/date-time-picker'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { PLAN_COLORS, PLAN_DOT } from '@/features/plans/model/plan-colors'
import { planSchema, type TPlanFormData } from '@/features/plans/model/plan-schema'
import type { IPlan, TPlanDialogState } from '@/features/plans/model/plan-types'
import { cn } from '@/lib/utils'

const EMPTY_VALUES: TPlanFormData = {
	title: '',
	description: '',
	startDate: new Date(),
	endDate: new Date(),
	color: 'blue',
	taskId: null,
}

interface IPlanDialogProps {
	state: TPlanDialogState
	use24HourFormat: boolean
	onClose: () => void
	onCreate: (plan: IPlan) => void
	onUpdate: (plan: IPlan) => void
	onDelete: (plan: IPlan) => void
}

export function PlanDialog({
	state,
	use24HourFormat,
	onClose,
	onCreate,
	onUpdate,
	onDelete,
}: IPlanDialogProps) {
	const isOpen = state.mode !== 'closed'
	const isEditing = state.mode === 'edit'
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
				color: state.plan.color,
				taskId: state.plan.taskId ?? null,
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
			color: values.color,
			taskId: values.taskId ?? null,
		}

		if (state.mode === 'edit') onUpdate(plan)
		else onCreate(plan)
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit plan' : 'New plan'}</DialogTitle>
					<DialogDescription>
						{isEditing
							? 'Adjust this block of your calendar.'
							: 'Block out time for what you intend to do.'}
					</DialogDescription>
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
							name="color"
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="plan-color">Color</FieldLabel>
									<Select value={field.value} onValueChange={(value) => value && field.onChange(value)}>
										<SelectTrigger
											id="plan-color"
											className="w-full capitalize"
											aria-invalid={fieldState.invalid}
											onBlur={field.onBlur}
										>
											<SelectValue placeholder="Pick a color" />
										</SelectTrigger>
										<SelectContent>
											{PLAN_COLORS.map((color) => (
												<SelectItem key={color} value={color}>
													<span className="flex items-center gap-2 capitalize">
														<span className={cn('size-3 rounded-full', PLAN_DOT[color])} />
														{color}
													</span>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
								</Field>
							)}
						/>

						<Field>
							<FieldLabel htmlFor="plan-description">Description</FieldLabel>
							<Textarea id="plan-description" placeholder="Optional notes" {...register('description')} />
						</Field>
					</FieldGroup>
				</form>

				<DialogFooter className="sm:justify-between">
					{state.mode === 'edit' ? (
						<Button type="button" variant="destructive" onClick={() => onDelete(state.plan)}>
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
						<Button form="plan-form" type="submit">
							{isEditing ? 'Save' : 'Create'}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
