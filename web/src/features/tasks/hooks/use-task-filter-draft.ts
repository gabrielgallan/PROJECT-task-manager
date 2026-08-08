import { useCallback, useMemo, useState } from 'react'
import {
	EMPTY_TASK_FILTERS,
	extractTaskFilters,
	hasActiveTaskFilters,
	type ITaskFilters,
	type ITaskQuery,
	isSameTaskFilters,
} from '@/features/tasks/model/task-query'
import type { TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'

function toggleValue<TValue extends string>(values: TValue[], value: TValue): TValue[] {
	return values.includes(value)
		? values.filter((current) => current !== value)
		: [...values, value]
}

export interface IUseTaskFilterDraft {
	draft: ITaskFilters
	/** The draft says something the applied filters do not: there is work to submit. */
	isDirty: boolean
	canClear: boolean
	setDraftSearch: (search: string) => void
	toggleDraftStatus: (status: TaskStatus) => void
	toggleDraftPriority: (priority: TaskPriority) => void
	clearDraftStatus: () => void
	clearDraftPriority: () => void
	apply: () => void
	clearAll: () => void
}

interface IUseTaskFilterDraftOptions {
	query: ITaskQuery
	onApply: (filters: ITaskFilters) => void
	onClear: () => void
}

/**
 * Holds the filters being composed, apart from the ones actually narrowing the
 * list. Editing a facet only moves this draft; the list changes when it is
 * applied, so a half-built selection never reshuffles what is on screen.
 *
 * It lives above the toolbar because clearing is also offered from the empty
 * states — the draft has to follow those, or the toolbar would keep showing
 * filters that no longer apply.
 */
export function useTaskFilterDraft({
	query,
	onApply,
	onClear,
}: IUseTaskFilterDraftOptions): IUseTaskFilterDraft {
	const applied = useMemo(() => extractTaskFilters(query), [query])

	const [draft, setDraft] = useState<ITaskFilters>(applied)
	const [lastApplied, setLastApplied] = useState<ITaskFilters>(applied)

	// Whatever changes the applied filters from elsewhere — clearing from an empty
	// state, the back button, a pasted link — takes the draft with it.
	if (!isSameTaskFilters(applied, lastApplied)) {
		setLastApplied(applied)
		setDraft(applied)
	}

	const apply = useCallback(() => onApply(draft), [draft, onApply])

	const clearAll = useCallback(() => {
		setDraft(EMPTY_TASK_FILTERS)
		onClear()
	}, [onClear])

	return {
		draft,
		isDirty: !isSameTaskFilters(draft, applied),
		// Emptying the draft by hand still leaves the applied filters to undo.
		canClear: hasActiveTaskFilters(draft) || hasActiveTaskFilters(applied),
		setDraftSearch: useCallback(
			(search: string) => setDraft((current) => ({ ...current, search })),
			[],
		),
		toggleDraftStatus: useCallback(
			(status: TaskStatus) =>
				setDraft((current) => ({ ...current, status: toggleValue(current.status, status) })),
			[],
		),
		toggleDraftPriority: useCallback(
			(priority: TaskPriority) =>
				setDraft((current) => ({
					...current,
					priority: toggleValue(current.priority, priority),
				})),
			[],
		),
		clearDraftStatus: useCallback(() => setDraft((current) => ({ ...current, status: [] })), []),
		clearDraftPriority: useCallback(
			() => setDraft((current) => ({ ...current, priority: [] })),
			[],
		),
		apply,
		clearAll,
	}
}
