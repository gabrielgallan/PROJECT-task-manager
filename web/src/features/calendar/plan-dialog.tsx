import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { PLAN_DOT } from '@/features/calendar/colors'
import { PLAN_COLORS } from '@/features/calendar/constants'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'
import { DateTimePicker } from '@/features/calendar/date-time-picker'
import type { IPlan } from '@/features/calendar/interfaces'
import { planSchema, type TPlanFormData } from '@/features/calendar/schemas'
import { cn } from '@/lib/utils'

const EMPTY_VALUES: TPlanFormData = {
	title: '',
	description: '',
	startDate: new Date(),
	endDate: new Date(),
	color: 'blue',
	taskId: null,
}

/**
 * The one and only plan form. Mounted once at the calendar root and driven by
 * `dialog` in the calendar context — grid cells never mount a form of their own.
 */
export function PlanDialog() {
	const { dialog, closeDialog, addPlan, updatePlan, removePlan } = useCalendar()

	const isOpen = dialog.mode !== 'closed'
	const isEditing = dialog.mode === 'edit'

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
		if (dialog.mode === 'create') {
			reset({
				...EMPTY_VALUES,
				startDate: dialog.startDate,
				endDate: dialog.endDate,
			})
		}

		if (dialog.mode === 'edit') {
			reset({
				title: dialog.plan.title,
				description: dialog.plan.description ?? '',
				startDate: new Date(dialog.plan.startDate),
				endDate: new Date(dialog.plan.endDate),
				color: dialog.plan.color,
				taskId: dialog.plan.taskId ?? null,
			})
		}
	}, [dialog, reset])

	const onSubmit = (values: TPlanFormData) => {
		const plan: IPlan = {
			id: dialog.mode === 'edit' ? dialog.plan.id : crypto.randomUUID(),
			title: values.title,
			description: values.description?.trim() ? values.description : undefined,
			startDate: values.startDate.toISOString(),
			endDate: values.endDate.toISOString(),
			color: values.color,
			taskId: values.taskId ?? null,
		}

		if (dialog.mode === 'edit') {
			updatePlan(plan)
			toast.success('Plan updated')
		} else {
			addPlan(plan)
			toast.success('Plan created')
		}

		closeDialog()
	}

	const handleDelete = () => {
		if (dialog.mode !== 'edit') return
		removePlan(dialog.plan.id)
		toast.success('Plan deleted')
		closeDialog()
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) closeDialog()
			}}
		>
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
									<Select
										value={field.value}
										onValueChange={(value) => {
											if (value) field.onChange(value)
										}}
									>
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
							<Textarea
								id="plan-description"
								placeholder="Optional notes"
								{...register('description')}
							/>
						</Field>
					</FieldGroup>
				</form>

				<DialogFooter className="sm:justify-between">
					{isEditing ? (
						<Button type="button" variant="destructive" onClick={handleDelete}>
							<Trash2 />
							Delete
						</Button>
					) : (
						<span />
					)}

					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={closeDialog}>
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
