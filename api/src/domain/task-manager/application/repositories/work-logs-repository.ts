import type { WorkLogData } from '../../enterprise/entities/value-objects/work-log-data'
import type { WorkLog } from '../../enterprise/entities/work-log'

export type WorkLogDateRangeInput = {
	from: Date
	to: Date
}

export type WorkLogFilterInput = {
	taskIds?: string[]
	categoryIds?: string[]
	withoutTask?: boolean
	withoutCategory?: boolean
}

export abstract class WorkLogsRepository {
	abstract create(workLog: WorkLog): Promise<void>
	abstract findByUserIdOverlapping(
		userId: string,
		startsAt: Date,
		endsAt: Date,
		excludeWorkLogId?: string,
	): Promise<WorkLog | null>
	abstract findById(workLogId: string): Promise<WorkLog | null>
	abstract fetchAllWithDataByUserId(
		userId: string,
		range: WorkLogDateRangeInput,
		filters?: WorkLogFilterInput,
	): Promise<WorkLogData[]>
	abstract fetchAllByTaskId(userId: string, taskId: string): Promise<WorkLog[]>
	abstract save(workLog: WorkLog): Promise<void>
	abstract delete(workLog: WorkLog): Promise<void>
}
