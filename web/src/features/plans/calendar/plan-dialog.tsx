import { CircleCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { DateTimePicker } from '@/components/date-time-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CategoryCombobox } from '@/features/categories/components/category-combobox'
import type { ICategory } from '@/features/categories/model/category-types'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { usePlanForm } from '@/features/plans/hooks/use-plan-form'
import { useConfirmPlan, useDeletePlan } from '@/features/plans/hooks/use-plan-mutations'
import { usePlanConfirmationBlocked, usePlanPending } from '@/features/plans/hooks/use-plan-pending'
import { getPlanError, PlanActionBlockedError } from '@/features/plans/model/plan-errors'
import type { TPlanDialogState } from '@/features/plans/model/plan-types'
import { TaskCombobox } from '@/features/tasks/components/task-combobox'
import type { Task } from '@/features/tasks/model/task-types'

interface Props {
	state: TPlanDialogState
	tasks: Task[]
	categories: ICategory[]
	timeZone: string
	use24HourFormat: boolean
	onClose: () => void
}

export function PlanDialog({
	state,
	tasks,
	categories,
	timeZone,
	use24HourFormat,
	onClose,
}: Props) {
	const editing = state.mode === 'edit' ? state.plan.plan : null
	const deleteMutation = useDeletePlan()
	const confirmMutation = useConfirmPlan()
	const { capture } = useIdentityLifecycle()
	const locked = usePlanPending(editing?.id)
	const confirmationBlocked = usePlanConfirmationBlocked(editing?.id)
	const [actionError, setActionError] = useState<string | null>(null)
	const [actionUnavailable, setActionUnavailable] = useState(false)
	const {
		form,
		submit,
		pending: formPending,
		requestError,
		ambiguous,
		unavailable,
	} = usePlanForm(state, timeZone, (message) => {
		if (message) toast.success(message)
		onClose()
	})
	const pending = formPending || deleteMutation.isPending || confirmMutation.isPending || locked
	const blocked = unavailable || actionUnavailable
	const confirmBlockedReason =
		editing?.confirmedAt || confirmationBlocked
			? 'Already recorded as a work log'
			: editing && Date.parse(editing.endsAt) > Date.now()
				? 'Only past plans can be recorded'
				: null
	const errors = form.formState.errors

	async function remove() {
		if (!editing || pending || !window.confirm(`Delete “${editing.title}”?`)) return
		const current = capture()
		setActionError(null)
		try {
			await deleteMutation.mutateAsync({ planId: editing.id })
			if (!current()) return
			toast.success('Plan deleted')
			onClose()
		} catch (error) {
			if (current() && getHttpStatus(error) === 404) setActionUnavailable(true)
			if (current() && !(error instanceof PlanActionBlockedError))
				setActionError(getPlanError(error, 'delete'))
		}
	}

	async function record() {
		if (!editing || pending || confirmBlockedReason) return
		const current = capture()
		setActionError(null)
		try {
			await confirmMutation.mutateAsync({ planId: editing.id, timeZone })
			if (!current()) return
			toast.success('Work log recorded')
			onClose()
		} catch (error) {
			if (current() && getHttpStatus(error) === 404) setActionUnavailable(true)
			if (current() && !(error instanceof PlanActionBlockedError))
				setActionError(getPlanError(error, 'confirm'))
		}
	}

	return (
		<Dialog open={state.mode !== 'closed'} onOpenChange={(open) => !open && !pending && onClose()}>
			<DialogContent className="sm:max-w-md" showCloseButton={!pending}>
				<DialogHeader>
					<DialogTitle>{editing ? 'Edit plan' : 'New plan'}</DialogTitle>
				</DialogHeader>
				{(requestError || actionError) && (
					<Alert variant="destructive">
						<AlertDescription>{requestError ?? actionError}</AlertDescription>
					</Alert>
				)}
				<form id="plan-form" onSubmit={submit} noValidate>
					<fieldset disabled={pending || blocked}>
						<FieldGroup>
							<Field data-invalid={!!errors.title}>
								<FieldLabel htmlFor="plan-title">Title</FieldLabel>
								<Input
									id="plan-title"
									placeholder="What are you going to work on?"
									aria-invalid={!!errors.title}
									aria-describedby={errors.title ? 'plan-title-error' : undefined}
									{...form.register('title')}
								/>
								{errors.title && (
									<p id="plan-title-error" className="text-sm text-destructive">
										{errors.title.message}
									</p>
								)}
							</Field>
							<div className="grid gap-4 sm:grid-cols-2">
								{(['startDate', 'endDate'] as const).map((name) => (
									<Controller
										key={name}
										control={form.control}
										name={name}
										render={({ field, fieldState }) => (
											<DateTimePicker
												id={`plan-${name === 'startDate' ? 'start' : 'end'}`}
												label={name === 'startDate' ? 'Start' : 'End'}
												value={field.value}
												use24HourFormat={use24HourFormat}
												onChange={field.onChange}
												onBlur={field.onBlur}
												invalid={fieldState.invalid}
												error={fieldState.error?.message}
												disabled={pending}
												description={
													ambiguous[name === 'startDate' ? 'start' : 'end']
														? 'This time occurs twice; the earlier occurrence will be used.'
														: undefined
												}
											/>
										)}
									/>
								))}
							</div>
							<Controller
								control={form.control}
								name="taskId"
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="plan-task">Task</FieldLabel>
										<TaskCombobox
											id="plan-task"
											selectedLabel={
												editing?.task?.id === field.value
													? editing.task.title
													: tasks.find((task) => task.id === field.value)?.title
											}
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											invalid={fieldState.invalid}
											disabled={pending}
											aria-describedby={fieldState.error ? 'plan-task-error' : undefined}
										/>
										{fieldState.error && (
											<p id="plan-task-error" className="text-sm text-destructive">
												{fieldState.error.message}
											</p>
										)}
									</Field>
								)}
							/>
							<Controller
								control={form.control}
								name="categoryId"
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="plan-category">Category</FieldLabel>
										<CategoryCombobox
											id="plan-category"
											categories={categories}
											selectedLabel={
												editing?.category?.id === field.value ? editing.category.name : undefined
											}
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											invalid={fieldState.invalid}
											disabled={pending}
											aria-describedby={fieldState.error ? 'plan-category-error' : undefined}
										/>
										{fieldState.error && (
											<p id="plan-category-error" className="text-sm text-destructive">
												{fieldState.error.message}
											</p>
										)}
									</Field>
								)}
							/>
							<Field data-invalid={!!errors.description}>
								<FieldLabel htmlFor="plan-description">Description</FieldLabel>
								<Textarea
									id="plan-description"
									placeholder="Optional notes"
									aria-invalid={!!errors.description}
									aria-describedby={errors.description ? 'plan-description-error' : undefined}
									{...form.register('description')}
								/>
								{errors.description && (
									<p id="plan-description-error" className="text-sm text-destructive">
										{errors.description.message}
									</p>
								)}
							</Field>
						</FieldGroup>
					</fieldset>
				</form>
				<DialogFooter className="sm:justify-between">
					{editing ? (
						<div className="flex gap-2">
							<Button
								type="button"
								variant="destructive"
								disabled={pending || blocked}
								onClick={() => void remove()}
							>
								<Trash2 />
								Delete
							</Button>
							<Tooltip>
								<TooltipTrigger render={<span tabIndex={confirmBlockedReason ? 0 : -1} />}>
									<Button
										type="button"
										variant="outline"
										disabled={pending || blocked || !!confirmBlockedReason}
										onClick={() => void record()}
									>
										<CircleCheck />
										{editing.confirmedAt ? 'Recorded' : 'Record as done'}
									</Button>
								</TooltipTrigger>
								{confirmBlockedReason && <TooltipContent>{confirmBlockedReason}</TooltipContent>}
							</Tooltip>
						</div>
					) : (
						<span />
					)}
					<div className="flex gap-2">
						<Button type="button" variant="outline" disabled={pending} onClick={onClose}>
							Cancel
						</Button>
						<Button form="plan-form" type="submit" disabled={pending || blocked}>
							{formPending ? (editing ? 'Saving…' : 'Creating…') : editing ? 'Save' : 'Create'}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
