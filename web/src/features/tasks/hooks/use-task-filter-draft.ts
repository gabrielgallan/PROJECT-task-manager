import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { EMPTY_TASK_FILTERS, extractTaskFilters, hasActiveTaskFilters, type ITaskFilters, type ITaskQuery, isSameTaskFilters } from '@/features/tasks/model/task-query'
import { taskFiltersSchema } from '@/features/tasks/model/task-schema'
import type { TaskPriority, TaskStatus } from '@/features/tasks/model/task-types'

export interface IUseTaskFilterDraft {
	draft: ITaskFilters; isDirty: boolean; canClear: boolean
	setDraftSearch: (search: string) => void; toggleDraftStatus: (status: TaskStatus) => void
	toggleDraftPriority: (priority: TaskPriority) => void; clearDraftStatus: () => void
	clearDraftPriority: () => void; apply: () => void; clearAll: () => void
}
interface Options { query: ITaskQuery; onApply: (filters: ITaskFilters) => void; onClear: () => void }
function toggle<T extends string>(values: T[], value: T) {
	return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}
export function useTaskFilterDraft({ query, onApply, onClear }: Options): IUseTaskFilterDraft {
	const applied = useMemo(() => extractTaskFilters(query), [query])
	const form = useForm<ITaskFilters>({ resolver: zodResolver(taskFiltersSchema), defaultValues: applied })
	const draft = form.watch()
	useEffect(() => { if (!isSameTaskFilters(form.getValues(), applied)) form.reset(applied) }, [applied, form])
	const apply = useCallback(() => { void form.handleSubmit(onApply)() }, [form, onApply])
	const clearAll = useCallback(() => { form.reset(EMPTY_TASK_FILTERS); onClear() }, [form, onClear])
	return {
		draft, isDirty: !isSameTaskFilters(draft, applied),
		canClear: hasActiveTaskFilters(draft) || hasActiveTaskFilters(applied),
		setDraftSearch: useCallback((search) => form.setValue('search', search, { shouldDirty: true, shouldValidate: true }), [form]),
		toggleDraftStatus: useCallback((status) => form.setValue('status', toggle(form.getValues('status'), status), { shouldDirty: true, shouldValidate: true }), [form]),
		toggleDraftPriority: useCallback((priority) => form.setValue('priority', toggle(form.getValues('priority'), priority), { shouldDirty: true, shouldValidate: true }), [form]),
		clearDraftStatus: useCallback(() => form.setValue('status', [], { shouldDirty: true, shouldValidate: true }), [form]),
		clearDraftPriority: useCallback(() => form.setValue('priority', [], { shouldDirty: true, shouldValidate: true }), [form]), apply, clearAll,
	}
}
