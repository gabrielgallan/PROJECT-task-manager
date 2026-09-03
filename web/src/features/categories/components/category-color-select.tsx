import type { Ref } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	CATEGORY_COLOR_LABELS,
	CATEGORY_COLORS,
	CATEGORY_DOT,
	type TCategoryColor,
} from '@/features/categories/model/category-colors'
import { cn } from '@/lib/utils'

interface ICategoryColorSelectProps {
	id?: string
	value: TCategoryColor
	onChange: (color: TCategoryColor) => void
	onBlur?: () => void
	invalid?: boolean
	disabled?: boolean
	className?: string
	ref?: Ref<HTMLButtonElement>
	'aria-describedby'?: string
}

export function CategoryColorSelect({
	id,
	value,
	onChange,
	onBlur,
	invalid,
	disabled,
	className,
	ref,
	'aria-describedby': describedBy,
}: ICategoryColorSelectProps) {
	return (
		<Select
			value={value}
			disabled={disabled}
			onValueChange={(next) => next && onChange(next as TCategoryColor)}
		>
			<SelectTrigger
				ref={ref}
				id={id}
				className={cn('w-full', className)}
				aria-invalid={invalid}
				aria-describedby={describedBy}
				onBlur={onBlur}
			>
				<SelectValue>
					{(color: TCategoryColor) => (
						<span className="flex items-center gap-2">
							<span className={cn('size-3 rounded-xs', CATEGORY_DOT[color])} />
							{CATEGORY_COLOR_LABELS[color]}
						</span>
					)}
				</SelectValue>
			</SelectTrigger>

			<SelectContent>
				{CATEGORY_COLORS.map((color) => (
					<SelectItem key={color} value={color}>
						<span className="flex items-center gap-2">
							<span className={cn('size-3 rounded-xs', CATEGORY_DOT[color])} />
							{CATEGORY_COLOR_LABELS[color]}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
