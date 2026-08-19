import type { WorkLog } from '../../enterprise/entities/work-log'

export abstract class WorkLogsRepository {
	abstract create(workLog: WorkLog): Promise<void>
}
