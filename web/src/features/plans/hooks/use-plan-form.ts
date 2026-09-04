import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
	calendarDateToInstant,
	calendarRangeToIso,
	InvalidCalendarTimeError,
	instantToCalendarDate,
} from '@/features/calendar/lib/time-zone'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { getPlanError, PlanActionBlockedError } from '../model/plan-errors'
import { planFormSchema, type TPlanFormData } from '../model/plan-schema'
import type { TPlanDialogState } from '../model/plan-types'
import { useCreatePlan, useEditPlan } from './use-plan-mutations'

const EMPTY_VALUES: TPlanFormData = {
	title: '',
	description: '',
	startDate: new Date(),
	endDate: new Date(),
	taskId: null,
	categoryId: null,
}

export function usePlanForm(
	state: TPlanDialogState,
	timeZone: string,
	onSaved: (message: string) => void,
) {
	const form = useForm<TPlanFormData>({
		resolver: zodResolver(planFormSchema),
		defaultValues: EMPTY_VALUES,
	})
	const create = useCreatePlan()
	const edit = useEditPlan()
	const [requestError, setRequestError] = useState<string | null>(null)
	const [unavailable, setUnavailable] = useState(false)
	const [ambiguous, setAmbiguous] = useState<{ start: boolean; end: boolean }>({
		start: false,
		end: false,
	})
	const previousTimeZone = useRef(timeZone)
	const openedState = useRef<string | null>(null)
	const editing = state.mode === 'edit' ? state.plan.plan : null
	const startDate = form.watch('startDate')
	const endDate = form.watch('endDate')

	useEffect(() => {
		const key =
			state.mode === 'closed'
				? 'closed'
				: state.mode === 'edit'
					? `edit:${state.plan.id}`
					: `create:${state.range.startDate.getTime()}:${state.range.endDate.getTime()}`
		if (openedState.current === key) return
		openedState.current = key
		setRequestError(null)
		setUnavailable(false)
		setAmbiguous({ start: false, end: false })
		if (state.mode === 'create')
			form.reset({
				...EMPTY_VALUES,
				startDate: state.range.startDate,
				endDate: state.range.endDate,
			})
		else if (state.mode === 'edit')
			form.reset({
				title: state.plan.plan.title,
				description: state.plan.plan.description ?? '',
				startDate: instantToCalendarDate(state.plan.plan.startsAt, timeZone),
				endDate: instantToCalendarDate(state.plan.plan.endsAt, timeZone),
				taskId: state.plan.plan.task?.id ?? null,
				categoryId: state.plan.plan.category?.id ?? null,
			})
		previousTimeZone.current = timeZone
	}, [state, form.reset, timeZone])

	useEffect(() => {
		const previous = previousTimeZone.current
		if (previous === timeZone || state.mode === 'closed') return
		const values = form.getValues()
		for (const field of ['startDate', 'endDate'] as const) {
			try {
				const original = editing?.[field === 'startDate' ? 'startsAt' : 'endsAt']
				const instant = calendarDateToInstant(values[field], previous, { original }).iso
				form.setValue(field, instantToCalendarDate(instant, timeZone), { shouldDirty: true })
			} catch {
				/* preserve invalid civil input for correction */
			}
		}
		previousTimeZone.current = timeZone
	}, [form, state.mode, timeZone])

	useEffect(() => {
		if (state.mode === 'closed') return
		const next = { start: false, end: false }
		for (const [field, date] of [
			['startDate', startDate],
			['endDate', endDate],
		] as const) {
			try {
				const result = calendarDateToInstant(date, timeZone)
				next[field === 'startDate' ? 'start' : 'end'] = result.ambiguous
				if (
					form.getFieldState(field).error?.message ===
					'This time does not exist in the selected timezone.'
				)
					form.clearErrors(field)
			} catch (error) {
				if (error instanceof InvalidCalendarTimeError)
					form.setError(field, { message: error.message })
			}
		}
		setAmbiguous(next)
	}, [endDate, form, startDate, state.mode, timeZone])

	const pending = create.isPending || edit.isPending
	const submit = form.handleSubmit(async (values) => {
		setRequestError(null)
		form.clearErrors(['startDate', 'endDate'])
		let range: ReturnType<typeof calendarRangeToIso>
		try {
			range = calendarRangeToIso(
				{ startDate: values.startDate, endDate: values.endDate },
				timeZone,
				editing ? { startsAt: editing.startsAt, endsAt: editing.endsAt } : undefined,
			)
		} catch (error) {
			const message =
				error instanceof InvalidCalendarTimeError ? error.message : 'End must be after start'
			form.setError(
				error instanceof InvalidCalendarTimeError && error.boundary === 'start'
					? 'startDate'
					: 'endDate',
				{ message },
			)
			return
		}
		setAmbiguous({ start: range.ambiguousStart, end: range.ambiguousEnd })
		try {
			if (!editing) {
				await create.mutateAsync({
					title: values.title,
					startsAt: range.startsAt,
					endsAt: range.endsAt,
					...(values.description ? { description: values.description } : {}),
					...(values.taskId ? { taskId: values.taskId } : {}),
					...(values.categoryId ? { categoryId: values.categoryId } : {}),
				})
				onSaved('Plan created')
				return
			}
			const body = {
				...(values.title !== editing.title ? { title: values.title } : {}),
				...(values.description !== (editing.description ?? '')
					? { description: values.description || null }
					: {}),
				...(values.taskId !== (editing.task?.id ?? null) ? { taskId: values.taskId } : {}),
				...(values.categoryId !== (editing.category?.id ?? null)
					? { categoryId: values.categoryId }
					: {}),
				...(range.startsAt !== editing.startsAt ? { startsAt: range.startsAt } : {}),
				...(range.endsAt !== editing.endsAt ? { endsAt: range.endsAt } : {}),
			}
			if (Object.keys(body).length === 0) {
				onSaved('')
				return
			}
			await edit.mutateAsync({ planId: editing.id, ...body })
			onSaved('Plan updated')
		} catch (error) {
			if (error instanceof PlanActionBlockedError) return
			if (editing && getHttpStatus(error) === 404) setUnavailable(true)
			setRequestError(getPlanError(error, editing ? 'edit' : 'create'))
		}
	})

	return { form, submit, pending, requestError, ambiguous, unavailable }
}
