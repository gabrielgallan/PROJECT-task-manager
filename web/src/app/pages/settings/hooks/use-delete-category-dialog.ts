import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCategoryDeletionImpact } from '@/features/categories/hooks/use-category-deletion-impact'
import { useDeleteCategory } from '@/features/categories/hooks/use-category-mutations'
import { getCategoryError } from '@/features/categories/model/category-errors'
import { categoryKeys } from '@/features/categories/model/category-query-keys'
import type { ICategory } from '@/features/categories/model/category-types'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { planKeys } from '@/features/plans/model/plan-query-keys'
import { workLogKeys } from '@/features/work-logs/model/work-log-query-keys'

export function useDeleteCategoryDialog(category: ICategory, onClose: () => void) {
	const { generation, client, capture, busy, ended } = useIdentityLifecycle()
	const [unavailable, setUnavailable] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [pending, setPending] = useState(false)
	const locked = useRef(false)
	const reconciled = useRef(false)
	const mutation = useDeleteCategory()
	const impact = useCategoryDeletionImpact(category.id, !unavailable && !pending)
	const notFound = getHttpStatus(impact.error) === 404

	useEffect(() => {
		if ((!notFound && !unavailable) || reconciled.current) return
		reconciled.current = true
		setUnavailable(true)
		const current = capture()
		const queryKey = categoryKeys.deletionImpact(generation, category.id)
		void client.cancelQueries({ queryKey, exact: true }).then(async () => {
			if (!current()) return
			client.removeQueries({ queryKey, exact: true })
			// A DELETE failure already reconciles the list in its mutation hook.
			if (notFound) {
				await client.invalidateQueries({ queryKey: categoryKeys.list(generation), exact: true })
			}
		})
	}, [notFound, unavailable, capture, client, generation, category.id])

	const ready = impact.isFetchedAfterMount && impact.isSuccess && !impact.isFetching
	const disabled = pending || busy || ended
	const canConfirm = ready && !disabled && !unavailable && !notFound && impact.validId
	const impactError =
		impact.error && !impact.isFetching ? getCategoryError(impact.error, 'impact') : null
	const displayedError =
		unavailable || notFound
			? 'This category is no longer available. Refresh the list.'
			: !impact.validId
				? 'This category could not be accessed. Refresh the list and try again.'
				: (error ?? impactError)

	async function confirm() {
		if (locked.current || !canConfirm) return
		locked.current = true
		setPending(true)
		setError(null)
		const current = capture()
		try {
			await mutation.mutateAsync({ categoryId: category.id })
			if (!current()) return
			void client.invalidateQueries({ queryKey: planKeys.all }, { throwOnError: false })
			void client.invalidateQueries(
				{ queryKey: workLogKeys.lists(generation) },
				{ throwOnError: false },
			)
			toast.success('Category deleted', {
				description: 'Associated plans and work logs are now uncategorized.',
			})
			onClose()
		} catch (failure) {
			if (!current()) return
			if (getHttpStatus(failure) === 404) setUnavailable(true)
			setError(getCategoryError(failure, 'delete'))
		} finally {
			locked.current = false
			if (current()) setPending(false)
		}
	}

	function close() {
		if (!locked.current && !disabled) onClose()
	}

	function retry() {
		if (disabled || unavailable || notFound || !impact.validId || impact.isFetching) return
		setError(null)
		void impact.refetch()
	}

	return {
		confirm,
		close,
		retry,
		pending,
		disabled,
		canConfirm,
		error: displayedError,
		counts: ready && !unavailable ? impact.data?.data : undefined,
		checking: !pending && !displayedError && !ready,
		canRetry: !unavailable && !notFound && impact.validId && !disabled && !impact.isFetching,
	}
}
