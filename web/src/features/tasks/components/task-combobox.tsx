import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { useTaskDetailsQuery } from '@/features/tasks/hooks/use-task-details-query'
import { useTaskOptionsQuery } from '@/features/tasks/hooks/use-task-options-query'
import { getTaskError } from '@/features/tasks/model/task-errors'
import {
	type TaskOptionsSearchValues,
	taskOptionsSearchSchema,
} from '@/features/tasks/model/task-schema'

interface TaskOption {
	value: string
	label: string
}
interface TaskComboboxProps {
	id: string
	selectedLabel?: string
	value: string | null
	onChange: (taskId: string | null) => void
	onBlur?: () => void
	invalid?: boolean
	placeholder?: string
	disabled?: boolean
	'aria-describedby'?: string
}
export function TaskCombobox({
	id,
	selectedLabel,
	value,
	onChange,
	onBlur,
	invalid,
	disabled,
	placeholder = 'No task',
	'aria-describedby': describedBy,
}: TaskComboboxProps) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const loadingNextPage = useRef(false)
	const form = useForm<TaskOptionsSearchValues>({
		resolver: zodResolver(taskOptionsSearchSchema),
		defaultValues: { q: '' },
		mode: 'onChange',
	})
	const queryText = form.watch('q')
	useEffect(() => {
		const timer = window.setTimeout(() => setSearch(queryText.trim()), 300)
		return () => window.clearTimeout(timer)
	}, [queryText])
	const validSearch = taskOptionsSearchSchema.safeParse({ q: queryText }).success
	const query = useTaskOptionsQuery(search, open && validSearch)
	const options = useMemo(() => {
		const map = new Map<string, TaskOption>()
		for (const page of query.data?.pages ?? []) {
			for (const task of page.data) map.set(task.id, { value: task.id, label: task.title })
		}
		if (value && selectedLabel) map.set(value, { value, label: selectedLabel })
		return [...map.values()]
	}, [query.data, selectedLabel, value])
	const selectedFromOptions = options.find((option) => option.value === value)
	const details = useTaskDetailsQuery(value ?? '', open && !!value && !selectedFromOptions)
	const selected =
		selectedFromOptions ??
		(details.data ? { value: details.data.task.id, label: details.data.task.title } : null)
	const error = query.error
		? getTaskError(query.error, 'options')
		: details.error
			? getTaskError(details.error, 'details')
			: null
	const nextPageError = query.isFetchNextPageError
	const invalidCursor = nextPageError && getHttpStatus(query.error) === 400
	const searchError = form.formState.errors.q?.message
	async function loadNextPage() {
		if (loadingNextPage.current || query.isFetchingNextPage) return
		loadingNextPage.current = true
		try {
			await query.fetchNextPage({ cancelRefetch: false })
		} finally {
			loadingNextPage.current = false
		}
	}
	return (
		<Combobox
			items={options}
			value={selected}
			filter={null}
			open={open}
			onOpenChange={setOpen}
			onInputValueChange={(next) => form.setValue('q', next, { shouldValidate: true })}
			onValueChange={(option) => onChange(option?.value ?? null)}
			isItemEqualToValue={(item, current) => item.value === current.value}
		>
			<ComboboxInput
				id={id}
				className="w-full"
				placeholder={placeholder}
				showClear
				disabled={disabled}
				aria-invalid={invalid || !!searchError}
				aria-describedby={
					[describedBy, searchError ? `${id}-search-error` : undefined].filter(Boolean).join(' ') ||
					undefined
				}
				onBlur={onBlur}
			/>
			{searchError && (
				<p id={`${id}-search-error`} className="text-sm text-destructive">
					{searchError}
				</p>
			)}
			<ComboboxContent>
				{error && (
					<div className="space-y-2 p-2">
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
						{query.error && (
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() =>
									void (invalidCursor
										? query.restart()
										: nextPageError
											? loadNextPage()
											: query.refetch())
								}
								disabled={query.isFetching}
							>
								{invalidCursor ? 'Restart search' : nextPageError ? 'Retry' : 'Try again'}
							</Button>
						)}
					</div>
				)}
				{query.isPending && (
					<p role="status" className="p-2 text-sm text-muted-foreground">
						Loading tasks…
					</p>
				)}
				<ComboboxEmpty>No tasks found.</ComboboxEmpty>
				<ComboboxList>
					{(option: TaskOption) => (
						<ComboboxItem key={option.value} value={option}>
							{option.label}
						</ComboboxItem>
					)}
				</ComboboxList>
				{query.hasNextPage && (
					<div className="border-t p-1">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="w-full"
							disabled={query.isFetchingNextPage}
							onClick={() => void loadNextPage()}
						>
							{query.isFetchingNextPage ? 'Loading…' : 'Load more'}
						</Button>
					</div>
				)}
			</ComboboxContent>
		</Combobox>
	)
}
