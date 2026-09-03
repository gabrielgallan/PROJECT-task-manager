import { Controller } from 'react-hook-form'
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
import { CategoryColorSelect } from '@/features/categories/components/category-color-select'
import { useCategoryForm } from '@/features/categories/hooks/use-category-form'
import type { TCategoryDialogState } from '@/features/categories/model/category-types'

interface ICategoryDialogProps {
	state: TCategoryDialogState
	onClose: () => void
}

export function CategoryDialog({ state, onClose }: ICategoryDialogProps) {
	if (state.mode === 'closed') return null
	return (
		<CategoryFormDialog
			key={state.mode === 'edit' ? state.category.id : 'create'}
			state={state}
			onClose={onClose}
		/>
	)
}

function CategoryFormDialog({
	state,
	onClose,
}: {
	state: Exclude<TCategoryDialogState, { mode: 'closed' }>
	onClose: () => void
}) {
	const { form, onSubmit, close, error, pending, disabled, unavailable, hasChanges } =
		useCategoryForm(state, onClose)
	const {
		register,
		control,
		formState: { errors },
	} = form
	const isEditing = state.mode === 'edit'
	return (
		<Dialog open onOpenChange={(open) => !open && close()}>
			<DialogContent className="sm:max-w-sm" showCloseButton={!disabled}>
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Edit category' : 'New category'}</DialogTitle>
				</DialogHeader>
				<form id="category-form" onSubmit={onSubmit} noValidate className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<fieldset disabled={disabled || unavailable}>
						<FieldGroup>
							<Field data-invalid={!!errors.name}>
								<FieldLabel htmlFor="category-name">Name</FieldLabel>
								<Input
									id="category-name"
									placeholder="e.g. Development"
									aria-invalid={!!errors.name}
									aria-describedby={errors.name ? 'name-error' : undefined}
									{...register('name')}
								/>
								{errors.name && (
									<p id="name-error" className="text-sm text-destructive">
										{errors.name.message}
									</p>
								)}
							</Field>
							<Controller
								control={control}
								name="color"
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="category-color">Color</FieldLabel>
										<CategoryColorSelect
											id="category-color"
											ref={field.ref}
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											invalid={fieldState.invalid}
											disabled={disabled || unavailable}
											aria-describedby={errors.color ? 'color-error' : undefined}
										/>
										{errors.color && (
											<p id="color-error" className="text-sm text-destructive">
												{errors.color.message}
											</p>
										)}
									</Field>
								)}
							/>
						</FieldGroup>
					</fieldset>
				</form>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={close} disabled={disabled}>
						{unavailable ? 'Close' : 'Cancel'}
					</Button>
					<Button
						form="category-form"
						type="submit"
						disabled={disabled || unavailable || !hasChanges}
					>
						{pending ? (isEditing ? 'Saving…' : 'Creating…') : isEditing ? 'Save' : 'Create'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
