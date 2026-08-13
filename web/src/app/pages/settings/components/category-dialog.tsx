import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { CategoryColorSelect } from '@/features/categories/components/category-color-select'
import {
	categorySchema,
	type TCategoryFormData,
} from '@/features/categories/model/category-schema'
import { normalizeCategoryName } from '@/features/categories/model/category-rules'
import type { ICategory } from '@/features/categories/model/category-types'
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

export type TCategoryDialogState =
	| { mode: 'closed' }
	| { mode: 'create' }
	| { mode: 'edit'; category: ICategory }

const EMPTY_VALUES: TCategoryFormData = {
	name: '',
	color: 'blue',
}

interface ICategoryDialogProps {
	state: TCategoryDialogState
	categories: ICategory[]
	onClose: () => void
	onCreate: (category: ICategory) => void
	onUpdate: (category: ICategory) => void
}

export function CategoryDialog({
	state,
	categories,
	onClose,
	onCreate,
	onUpdate,
}: ICategoryDialogProps) {
	const isOpen = state.mode !== 'closed'
	const isEditing = state.mode === 'edit'
	const {
		control,
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors },
	} = useForm<TCategoryFormData>({
		resolver: zodResolver(categorySchema),
		defaultValues: EMPTY_VALUES,
	})

	useEffect(() => {
		if (state.mode === 'edit') {
			reset({ name: state.category.name, color: state.category.color })
		} else if (state.mode === 'create') {
			reset(EMPTY_VALUES)
		}
	}, [reset, state])

	const submit = (values: TCategoryFormData) => {
		const currentId = state.mode === 'edit' ? state.category.id : null
		const normalizedName = normalizeCategoryName(values.name)
		const duplicate = categories.some(
			(category) =>
				category.id !== currentId && normalizeCategoryName(category.name) === normalizedName,
		)

		if (duplicate) {
			setError('name', { message: 'A category with this name already exists' })
			return
		}

		const category: ICategory = {
			id: currentId ?? crypto.randomUUID(),
			name: values.name,
			color: values.color,
		}

		if (isEditing) onUpdate(category)
		else onCreate(category)
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit category' : 'New category'}</DialogTitle>
				</DialogHeader>

				<form id="category-form" onSubmit={handleSubmit(submit)} noValidate>
					<FieldGroup>
						<Field data-invalid={!!errors.name}>
							<FieldLabel htmlFor="category-name">Name</FieldLabel>
							<Input
								id="category-name"
								placeholder="e.g. Development"
								aria-invalid={!!errors.name}
								maxLength={40}
								{...register('name')}
							/>
							<FieldError errors={errors.name ? [errors.name] : undefined} />
						</Field>

						<Controller
							control={control}
							name="color"
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="category-color">Color</FieldLabel>
									<CategoryColorSelect
										id="category-color"
										value={field.value}
										onChange={field.onChange}
										onBlur={field.onBlur}
										invalid={fieldState.invalid}
									/>
									<FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
								</Field>
							)}
						/>
					</FieldGroup>
				</form>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button form="category-form" type="submit">
						{isEditing ? 'Save' : 'Create'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
