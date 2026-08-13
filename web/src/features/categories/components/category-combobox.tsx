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
}

export function CategoryCombobox({
	id,
	categories,
	value,
	onChange,
	onBlur,
	invalid,
	placeholder = 'No category',
}: ICategoryComboboxProps) {
	const options = useMemo<ICategoryOption[]>(
		() =>
			categories.map((category) => ({
				value: category.id,
				label: category.name,
				color: category.color,
			})),
		[categories],
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
			<ComboboxInput
				id={id}
				className="w-full"
				placeholder={placeholder}
				showClear
				aria-invalid={invalid}
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
