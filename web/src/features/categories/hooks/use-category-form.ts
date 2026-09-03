import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { getCategoryError } from '../model/category-errors'
import { categoryKeys } from '../model/category-query-keys'
import { categorySchema, type TCategoryFormData } from '../model/category-schema'
import type { TCategoryDialogState } from '../model/category-types'
import { useCreateCategory, useEditCategory } from './use-category-mutations'

type OpenCategoryDialogState = Exclude<TCategoryDialogState, { mode: 'closed' }>

function getChanges(values: TCategoryFormData, original: TCategoryFormData) {
	const changes: Partial<TCategoryFormData> = {}
	if (values.name.trim() !== original.name) changes.name = values.name.trim()
	if (values.color !== original.color) changes.color = values.color
	return changes
}

// The dialog mounts a fresh form for each opening/target; query refetches never reset a draft.
export function useCategoryForm(state: OpenCategoryDialogState, onClose: () => void) {
	const { capture, busy, ended, generation, client } = useIdentityLifecycle()
	const [original] = useState<TCategoryFormData>(() =>
		state.mode === 'edit'
			? { name: state.category.name, color: state.category.color }
			: { name: '', color: 'blue' },
	)
	const [error, setError] = useState<string | null>(null)
	const [unavailable, setUnavailable] = useState(false)
	const locked = useRef(false)
	const create = useCreateCategory()
	const edit = useEditCategory()
	const form = useForm<TCategoryFormData>({
		resolver: zodResolver(categorySchema),
		defaultValues: original,
	})
	const hasChanges =
		state.mode === 'create' || Object.keys(getChanges(form.watch(), original)).length > 0
	const pending = form.formState.isSubmitting || create.isPending || edit.isPending
	const disabled = pending || busy || ended

	async function submit(values: TCategoryFormData) {
		if (locked.current || disabled || unavailable) return
		const changes = getChanges(values, original)
		if (state.mode === 'edit' && !Object.keys(changes).length) return
		locked.current = true
		const current = capture()
		setError(null)
		try {
			if (state.mode === 'edit') {
				await edit.mutateAsync({ categoryId: state.category.id, ...changes })
			} else {
				await create.mutateAsync(values)
			}
			if (!current()) return
			toast.success(state.mode === 'edit' ? 'Category updated' : 'Category created')
			onClose()
		} catch (failure) {
			if (!current()) return
			if (getHttpStatus(failure) === 404 && state.mode === 'edit') {
				setUnavailable(true)
				client.removeQueries({
					queryKey: categoryKeys.deletionImpact(generation, state.category.id),
					exact: true,
				})
			}
			setError(getCategoryError(failure, state.mode))
		} finally {
			locked.current = false
		}
	}

	function close() {
		if (!locked.current && !disabled) onClose()
	}

	return {
		form,
		onSubmit: form.handleSubmit(submit, () => setError(null)),
		close,
		error,
		pending,
		disabled,
		unavailable,
		hasChanges,
	}
}
