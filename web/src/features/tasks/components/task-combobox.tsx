import { useMemo } from 'react'
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox'
import type { Task } from '@/features/tasks/model/task-types'

/**
 * The combobox selects the whole option, not the id: `{ value, label }` is the shape it reads
 * natively — label for display, value for the form. Keeping the label attached to the selection
 * is also what will let a task chosen from a server page still render once the list moves on.
 */
interface ITaskOption {
	value: string
	label: string
}

interface ITaskComboboxProps {
	id: string
	tasks: Task[]
	/** The associated task, or null when the entry stands on its own. */
	value: string | null
	onChange: (taskId: string | null) => void
	onBlur?: () => void
	invalid?: boolean
	placeholder?: string
}

export function TaskCombobox({
	id,
	tasks,
	value,
	onChange,
	onBlur,
	invalid,
	placeholder = 'No task',
}: ITaskComboboxProps) {
	const options = useMemo<ITaskOption[]>(
		() => tasks.map((task) => ({ value: task.id, label: task.title })),
		[tasks],
	)

	const selected = useMemo(
		() => options.find((option) => option.value === value) ?? null,
		[options, value],
	)

	return (
		<Combobox
			items={options}
			value={selected}
			onValueChange={(option) => onChange(option?.value ?? null)}
			isItemEqualToValue={(item, current) => item.value === current.value}
		>
			{/* The clear button only mounts once a task is picked, so it takes the chevron's place
			    instead of crowding it. Clearing it is how an entry goes back to having no task. */}
			<ComboboxInput
				id={id}
				className="w-full"
				placeholder={placeholder}
				showClear
				aria-invalid={invalid}
				onBlur={onBlur}
			/>

			<ComboboxContent>
				<ComboboxEmpty>No tasks found.</ComboboxEmpty>
				<ComboboxList>
					{(option: ITaskOption) => (
						<ComboboxItem key={option.value} value={option}>
							{option.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	)
}
