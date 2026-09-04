import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { DateTimePicker } from '@/components/date-time-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { CategoryCombobox } from '@/features/categories/components/category-combobox'
import type { ICategory } from '@/features/categories/model/category-types'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { TaskCombobox } from '@/features/tasks/components/task-combobox'
import { useWorkLogForm } from '@/features/work-logs/hooks/use-work-log-form'
import { useDeleteWorkLog } from '@/features/work-logs/hooks/use-work-log-mutations'
import { useWorkLogPending } from '@/features/work-logs/hooks/use-work-log-pending'
import {
	getWorkLogError,
	WorkLogActionBlockedError,
} from '@/features/work-logs/model/work-log-errors'
import type { TWorkLogDialogState, WorkLog } from '@/features/work-logs/model/work-log-types'

interface Props {
	state: TWorkLogDialogState
	categories: ICategory[]
	knownWorkLogs: readonly WorkLog[]
	timeZone: string
	use24HourFormat: boolean
	onClose: () => void
}

export function WorkLogDialog({
	state,
	categories,
	knownWorkLogs,
	timeZone,
	use24HourFormat,
	onClose,
}: Props) {
	const editing = state.mode === 'edit' ? state.item.workLog : null
	const deleteMutation = useDeleteWorkLog()
	const { capture } = useIdentityLifecycle()
	const locked = useWorkLogPending(editing?.id)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)
	const [actionUnavailable, setActionUnavailable] = useState(false)
	const {
		form,
		submit,
		pending: formPending,
		requestError,
		ambiguous,
		unavailable,
	} = useWorkLogForm(state, timeZone, knownWorkLogs, (message) => {
		if (message) toast.success(message)
		onClose()
	})
	const pending = formPending || deleteMutation.isPending || locked
	const blocked = unavailable || actionUnavailable
	const errors = form.formState.errors

	async function remove() {
		if (!editing || pending || blocked) return
		const current = capture()
		setActionError(null)
		try {
			await deleteMutation.mutateAsync({ workLogId: editing.id })
			if (!current()) return
			toast.success('Work log deleted')
			setDeleteOpen(false)
			onClose()
		} catch (error) {
			if (!current()) return
			if (getHttpStatus(error) === 404) setActionUnavailable(true)
			if (!(error instanceof WorkLogActionBlockedError))
				setActionError(getWorkLogError(error, 'delete'))
		}
	}

	return (
		<>
			<Dialog
				open={state.mode !== 'closed'}
				onOpenChange={(open) => !open && !pending && onClose()}
			>
				<DialogContent className="sm:max-w-md" showCloseButton={!pending}>
					<DialogHeader>
						<DialogTitle>{editing ? 'Edit work log' : 'New work log'}</DialogTitle>
					</DialogHeader>

					{(requestError || actionError) && (
						<Alert variant="destructive">
							<AlertDescription>{requestError ?? actionError}</AlertDescription>
						</Alert>
					)}

					<form id="work-log-form" onSubmit={submit} noValidate>
						<fieldset disabled={pending || blocked}>
							<FieldGroup>
								<Field data-invalid={!!errors.title}>
									<FieldLabel htmlFor="work-log-title">Title</FieldLabel>
									<Input
										id="work-log-title"
										placeholder="What did you work on?"
										aria-invalid={!!errors.title}
										aria-describedby={errors.title ? 'work-log-title-error' : undefined}
										{...form.register('title')}
									/>
									<FieldError
										id="work-log-title-error"
										errors={errors.title ? [errors.title] : undefined}
									/>
								</Field>

								<div className="grid gap-4 sm:grid-cols-2">
									{(['startDate', 'endDate'] as const).map((name) => (
										<Controller
											key={name}
											control={form.control}
											name={name}
											render={({ field, fieldState }) => (
												<DateTimePicker
													id={`work-log-${name === 'startDate' ? 'start' : 'end'}`}
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
											<FieldLabel htmlFor="work-log-task">Task</FieldLabel>
											<TaskCombobox
												id="work-log-task"
												selectedLabel={
													editing?.task?.id === field.value ? editing.task.title : undefined
												}
												value={field.value}
												onChange={field.onChange}
												onBlur={field.onBlur}
												invalid={fieldState.invalid}
												disabled={pending}
												aria-describedby={fieldState.error ? 'work-log-task-error' : undefined}
											/>
											<FieldError
												id="work-log-task-error"
												errors={fieldState.error ? [fieldState.error] : undefined}
											/>
										</Field>
									)}
								/>

								<Controller
									control={form.control}
									name="categoryId"
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel htmlFor="work-log-category">Category</FieldLabel>
											<CategoryCombobox
												id="work-log-category"
												categories={categories}
												selectedLabel={
													editing?.category?.id === field.value ? editing.category.name : undefined
												}
												value={field.value}
												onChange={field.onChange}
												onBlur={field.onBlur}
												invalid={fieldState.invalid}
												disabled={pending}
												aria-describedby={fieldState.error ? 'work-log-category-error' : undefined}
											/>
											<FieldError
												id="work-log-category-error"
												errors={fieldState.error ? [fieldState.error] : undefined}
											/>
										</Field>
									)}
								/>

								<Field data-invalid={!!errors.description}>
									<FieldLabel htmlFor="work-log-description">Description</FieldLabel>
									<Textarea
										id="work-log-description"
										placeholder="Optional notes"
										aria-invalid={!!errors.description}
										aria-describedby={errors.description ? 'work-log-description-error' : undefined}
										{...form.register('description')}
									/>
									<FieldError
										id="work-log-description-error"
										errors={errors.description ? [errors.description] : undefined}
									/>
								</Field>
							</FieldGroup>
						</fieldset>
					</form>

					<DialogFooter className="sm:justify-between">
						{editing ? (
							<Button
								type="button"
								variant="destructive"
								disabled={pending || blocked}
								onClick={() => setDeleteOpen(true)}
							>
								<Trash2 />
								Delete
							</Button>
						) : (
							<span />
						)}
						<div className="flex gap-2">
							<Button type="button" variant="outline" disabled={pending} onClick={onClose}>
								Cancel
							</Button>
							<Button form="work-log-form" type="submit" disabled={pending || blocked}>
								{formPending ? (editing ? 'Saving…' : 'Creating…') : editing ? 'Save' : 'Create'}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={deleteOpen} onOpenChange={(open) => !pending && setDeleteOpen(open)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<Trash2 className="text-destructive" />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete work log</AlertDialogTitle>
						<AlertDialogDescription>
							“{editing?.title}” will be permanently removed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{actionError && (
						<Alert variant="destructive">
							<AlertDescription>{actionError}</AlertDescription>
						</Alert>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={pending || blocked}
							onClick={(event) => {
								event.preventDefault()
								void remove()
							}}
						>
							{deleteMutation.isPending ? 'Deleting…' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
