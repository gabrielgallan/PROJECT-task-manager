import { buildPrototypeWorkLogs, type PrototypeWorkLog } from '@/features/work-logs/mocks/work-logs'

export const REPORT_WORK_LOGS: readonly Readonly<PrototypeWorkLog>[] = Object.freeze(
	buildPrototypeWorkLogs().map((workLog) => Object.freeze(workLog)),
)
