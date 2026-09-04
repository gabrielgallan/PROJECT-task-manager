import { addDays } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWorkLogs } from '@/api/fetch-work-logs'
import { calendarDayStartToInstant, getZonedToday } from '@/features/calendar/lib/time-zone'
import { useEndSession, useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { getWorkLogError } from '../model/work-log-errors'
import { toWorkLog } from '../model/work-log-mappers'
import { normalizeWorkLogRequest, workLogKeys } from '../model/work-log-query-keys'
import { getLogNowSuggestion } from '../model/work-log-rules'

export interface LogNowDraft {
	range: NonNullable<ReturnType<typeof getLogNowSuggestion>['range']>
	original: { startsAt: string; endsAt: string }
}

export function useLogNow(timeZone: string) {
	const { client, generation, capture, busy, ended } = useIdentityLifecycle()
	const { revalidateSession } = useEndSession()
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const seenGeneration = useRef(generation)

	useEffect(() => {
		if (seenGeneration.current === generation) return
		seenGeneration.current = generation
		setPending(false)
		setError(null)
	}, [generation])

	const getRange = useCallback(async (): Promise<LogNowDraft | null> => {
		if (pending || busy || ended) return null
		const current = capture()
		const now = new Date().toISOString()
		const today = getZonedToday(timeZone)
		const request = normalizeWorkLogRequest({
			from: calendarDayStartToInstant(today, timeZone),
			to: calendarDayStartToInstant(addDays(today, 1), timeZone),
		})
		setPending(true)
		setError(null)
		try {
			const response = await client.fetchQuery({
				queryKey: workLogKeys.list(generation, request),
				queryFn: ({ signal }) => fetchWorkLogs(request, { signal }),
				staleTime: 10_000,
				retry: false,
				networkMode: 'always',
			})
			if (!current()) return null
			const suggestion = getLogNowSuggestion(
				response.data.map(toWorkLog),
				now,
				request.from,
				timeZone,
			)
			if (suggestion.error) {
				setError(suggestion.error)
				return null
			}
			return suggestion.range && suggestion.original
				? { range: suggestion.range, original: suggestion.original }
				: null
		} catch (failure) {
			if (!current()) return null
			await revalidateSession(failure)
			if (current()) setError(getWorkLogError(failure, 'list'))
			return null
		} finally {
			if (current()) setPending(false)
		}
	}, [busy, capture, client, ended, generation, pending, revalidateSession, timeZone])

	return { getRange, pending, error, clearError: () => setError(null) }
}
