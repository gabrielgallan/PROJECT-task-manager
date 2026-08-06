import { atom, useAtom } from 'jotai'
import { useCallback } from 'react'
import { WORK_LOGS_MOCK } from '@/features/work-logs/mocks/work-logs'
import type { IWorkLog } from '@/features/work-logs/model/work-log-types'

/**
 * Prototype-scoped state, not a data layer. It exists because a work log can be
 * created from the plans page, so both pages have to read the same collection.
 */
const workLogsAtom = atom<IWorkLog[]>(WORK_LOGS_MOCK)

export function useWorkLogs() {
	const [workLogs, setWorkLogs] = useAtom(workLogsAtom)

	const addWorkLog = useCallback(
		(workLog: IWorkLog) => setWorkLogs((previous) => [...previous, workLog]),
		[setWorkLogs],
	)

	const updateWorkLog = useCallback(
		(workLog: IWorkLog) =>
			setWorkLogs((previous) =>
				previous.map((item) =>
					item.id === workLog.id ? { ...workLog, updatedAt: new Date().toISOString() } : item,
				),
			),
		[setWorkLogs],
	)

	const removeWorkLog = useCallback(
		(workLog: IWorkLog) =>
			setWorkLogs((previous) => previous.filter((item) => item.id !== workLog.id)),
		[setWorkLogs],
	)

	return { workLogs, addWorkLog, updateWorkLog, removeWorkLog }
}
