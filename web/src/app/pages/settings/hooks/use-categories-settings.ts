import { useState } from 'react'
import { toast } from 'sonner'
import type { TCategoryColor } from '@/features/categories/model/category-colors'
import { getCategoryError } from '@/features/categories/model/category-errors'
import type { ICategory, TCategoryDialogState } from '@/features/categories/model/category-types'
import { useCategories } from '@/features/categories/store/categories-store'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'

export function useCategoriesSettings() {
	const query = useCategories()
	const { busy, ended, generation } = useIdentityLifecycle()
	const [dialog, setDialog] = useState<TCategoryDialogState>({ mode: 'closed' })
	const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null)

	function changeFallbackColor(color: TCategoryColor) {
		query.setUncategorizedColor(color)
		toast.success('Fallback color updated')
	}

	return {
		...query,
		error: query.error ? getCategoryError(query.error, 'list') : null,
		busy: busy || ended,
		generation,
		dialog,
		setDialog,
		closeDialog: () => setDialog({ mode: 'closed' }),
		deleteTarget,
		setDeleteTarget,
		changeFallbackColor,
	}
}
