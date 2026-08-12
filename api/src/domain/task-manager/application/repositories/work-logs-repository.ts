import type { WorkLog } from '../../enterprise/entities/work-log'

export interface WorkLogsRepository {
	create(workLog: WorkLog): Promise<void>
}
