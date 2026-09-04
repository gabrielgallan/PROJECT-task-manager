import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
	calendarDateToInstant,
	calendarRangeToIso,
	InvalidCalendarTimeError,
	instantToCalendarDate,
	isValidTimeZone,
} from '@/features/calendar/lib/time-zone'
import { getHttpStatus } from '@/features/identity/model/identity-errors'
import { getWorkLogError, WorkLogActionBlockedError } from '../model/work-log-errors'
import { validateWorkLogInterval } from '../model/work-log-rules'
import { type TWorkLogFormData, workLogSchema } from '../model/work-log-schema'
import type { TWorkLogDialogState, WorkLog } from '../model/work-log-types'
import { useCreateWorkLog, useEditWorkLog } from './use-work-log-mutations'

const EMPTY_VALUES: TWorkLogFormData = {
	title: '',
	description: '',
	startDate: new Date(),
	endDate: new Date(),
	taskId: null,
	categoryId: null,
}

export function useWorkLogForm(
	state: TWorkLogDialogState,
	timeZone: string,
	knownWorkLogs: readonly WorkLog[],
	onSaved: (message: string) => void,
) {
	const form = useForm<TWorkLogFormData>({
		resolver: zodResolver(workLogSchema),
		defaultValues: EMPTY_VALUES,
	})
	const create = useCreateWorkLog()
	const edit = useEditWorkLog()
	const [requestError, setRequestError] = useState<string | null>(null)
	const [unavailable, setUnavailable] = useState(false)
	const [ambiguous, setAmbiguous] = useState({ start: false, end: false })
	const previousTimeZone = useRef(timeZone)
	const openedState = useRef<string | null>(null)
	const editing = state.mode === 'edit' ? state.item.workLog : null
	const startDate = form.watch('startDate')
	const endDate = form.watch('endDate')

	useEffect(() => {
		const key =
			state.mode === 'closed'
				? 'closed'
				: state.mode === 'edit'
					? `edit:${state.item.id}`
					: `create:${state.range.startDate.getTime()}:${state.range.endDate.getTime()}`
		if (openedState.current === key) return
		openedState.current = key
		setRequestError(null)
		setUnavailable(false)
		setAmbiguous({ start: false, end: false })
		if (state.mode === 'create') form.reset({ ...EMPTY_VALUES, ...state.range })
		else if (state.mode === 'edit')
			form.reset({
				title: state.item.workLog.title,
				description: state.item.workLog.description ?? '',
				startDate: instantToCalendarDate(state.item.workLog.startsAt, timeZone),
				endDate: instantToCalendarDate(state.item.workLog.endsAt, timeZone),
				taskId: state.item.workLog.task?.id ?? null,
				categoryId: state.item.workLog.category?.id ?? null,
			})
		previousTimeZone.current = timeZone
	}, [form, state, timeZone])

	useEffect(() => {
		const previous = previousTimeZone.current
		if (previous === timeZone || state.mode === 'closed') return
		const values = form.getValues()
		for (const field of ['startDate', 'endDate'] as const) {
			try {
				const original = editing
					? editing[field === 'startDate' ? 'startsAt' : 'endsAt']
					: state.mode === 'create'
						? state.original?.[field === 'startDate' ? 'startsAt' : 'endsAt']
						: undefined
				const instant = calendarDateToInstant(values[field], previous, { original }).iso
				form.setValue(field, instantToCalendarDate(instant, timeZone), { shouldDirty: true })
			} catch {
				/* preserve invalid civil input for correction */
			}
		}
		previousTimeZone.current = timeZone
	}, [editing, form, state.mode, timeZone])

	useEffect(() => {
		if (state.mode === 'closed') return
		const next = { start: false, end: false }
		for (const [field, date] of [
			['startDate', startDate],
			['endDate', endDate],
		] as const) {
			try {
				const original = editing
					? editing[field === 'startDate' ? 'startsAt' : 'endsAt']
					: state.mode === 'create'
						? state.original?.[field === 'startDate' ? 'startsAt' : 'endsAt']
						: undefined
				const result = calendarDateToInstant(date, timeZone, { original })
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
	}, [editing, endDate, form, startDate, state.mode, timeZone])

	const pending = create.isPending || edit.isPending
	const submit = form.handleSubmit(async (values) => {
		setRequestError(null)
		form.clearErrors(['startDate', 'endDate'])
		if (timeZone.length > 255 || !isValidTimeZone(timeZone)) {
			setRequestError('Select a valid timezone in Settings.')
			return
		}
		let range: ReturnType<typeof calendarRangeToIso>
		try {
			range = calendarRangeToIso(
				{ startDate: values.startDate, endDate: values.endDate },
				timeZone,
				editing
					? { startsAt: editing.startsAt, endsAt: editing.endsAt }
					: state.mode === 'create'
						? state.original
						: undefined,
			)
		} catch (error) {
			const boundary =
				error instanceof InvalidCalendarTimeError && error.boundary === 'start'
					? 'startDate'
					: 'endDate'
			form.setError(
				boundary,
				{
					message:
						error instanceof InvalidCalendarTimeError ? error.message : 'End must be after start.',
				},
				{ shouldFocus: true },
			)
			return
		}
		setAmbiguous({ start: range.ambiguousStart, end: range.ambiguousEnd })
		const intervalError = validateWorkLogInterval(
			knownWorkLogs,
			range.startsAt,
			range.endsAt,
			timeZone,
			editing?.id,
		)
		if (intervalError) {
			if (intervalError.includes('conflicts')) setRequestError(intervalError)
			else form.setError('endDate', { message: intervalError }, { shouldFocus: true })
			return
		}

		try {
			const description = values.description.trim()
			if (!editing) {
				await create.mutateAsync({
					title: values.title,
					startsAt: range.startsAt,
					endsAt: range.endsAt,
					timeZone,
					...(description ? { description: values.description } : {}),
					...(values.taskId ? { taskId: values.taskId } : {}),
					...(values.categoryId ? { categoryId: values.categoryId } : {}),
				})
				onSaved('Work log created')
				return
			}

			const body = {
				...(values.title !== editing.title ? { title: values.title } : {}),
				...(values.description !== (editing.description ?? '')
					? { description: description ? values.description : null }
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
			await edit.mutateAsync({ workLogId: editing.id, ...body, timeZone })
			onSaved('Work log updated')
		} catch (error) {
			if (error instanceof WorkLogActionBlockedError) return
			if (editing && getHttpStatus(error) === 404) setUnavailable(true)
			setRequestError(getWorkLogError(error, editing ? 'edit' : 'create'))
		}
	})

	return { form, submit, pending, requestError, ambiguous, unavailable }
}
