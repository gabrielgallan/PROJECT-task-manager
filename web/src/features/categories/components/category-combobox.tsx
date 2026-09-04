import { useMemo } from 'react'
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox'
import { CATEGORY_DOT, type TCategoryColor } from '@/features/categories/model/category-colors'
import type { ICategory } from '@/features/categories/model/category-types'
import { cn } from '@/lib/utils'

interface ICategoryOption {
	value: string
	label: string
	color: TCategoryColor
}

interface ICategoryComboboxProps {
	id: string
	categories: ICategory[]
	value: string | null
	onChange: (categoryId: string | null) => void
	onBlur?: () => void
	invalid?: boolean
	placeholder?: string
	disabled?: boolean
	selectedLabel?: string
	'aria-describedby'?: string
}

export function CategoryCombobox({
	id,
	categories,
	value,
	onChange,
	onBlur,
	invalid,
	placeholder = 'No category',
	disabled,
	selectedLabel,
	'aria-describedby': describedBy,
}: ICategoryComboboxProps) {
	const options = useMemo<ICategoryOption[]>(() => {
		const values = categories.map((category) => ({
			value: category.id,
			label: category.name,
			color: category.color,
		}))
		if (value && selectedLabel && !values.some((option) => option.value === value))
			values.push({ value, label: selectedLabel, color: 'slate' })
		return values
	}, [categories, selectedLabel, value])

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
			<ComboboxInput
				id={id}
				className="w-full"
				placeholder={placeholder}
				showClear
				aria-invalid={invalid}
				aria-describedby={describedBy}
				disabled={disabled}
				onBlur={onBlur}
			/>

			<ComboboxContent>
				<ComboboxEmpty>No categories found.</ComboboxEmpty>
				<ComboboxList>
					{(option: ICategoryOption) => (
						<ComboboxItem key={option.value} value={option}>
							<span className={cn('size-3 shrink-0 rounded-xs', CATEGORY_DOT[option.color])} />
							<span className="truncate">{option.label}</span>
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	)
}
