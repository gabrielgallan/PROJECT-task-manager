import type { WorkLog } from '../../enterprise/entities/work-log'

export abstract class WorkLogsRepository {
	abstract create(workLog: WorkLog): Promise<void>
	abstract findByUserIdOverlapping(
		userId: string,
		startsAt: Date,
		endsAt: Date,
		excludeWorkLogId?: string,
	): Promise<WorkLog | null>
	abstract findById(workLogId: string): Promise<WorkLog | null>
	abstract save(workLog: WorkLog): Promise<void>
}
