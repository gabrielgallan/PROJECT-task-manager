import { WorkLogsRepository } from '@/domain/task-manager/application/repositories/work-logs-repository'
import { WorkLog } from '@/domain/task-manager/enterprise/entities/work-log'

export class InMemoryWorkLogsRepository implements WorkLogsRepository {
	public items: WorkLog[] = []

	async create(workLog: WorkLog) {
		this.items.push(workLog)

		return
	}

	async findByUserIdOverlapping(
		userId: string,
		startsAt: Date,
		endsAt: Date,
		excludeWorkLogId?: string,
	) {
		const workLog = this.items.find((item) => {
			if (item.userId.toString() !== userId) return false
			if (excludeWorkLogId && item.id.toString() === excludeWorkLogId) return false

			return startsAt < item.endsAt && endsAt > item.startsAt
		})

		return workLog ?? null
	}

	async findById(workLogId: string) {
		const workLog = this.items.find((w) => w.id.toString() === workLogId)

		return workLog ?? null
	}

	async save(workLog: WorkLog) {
		const workLogIndex = this.items.findIndex((w) => w.id.toString() === workLog.id.toString())

		if (workLogIndex >= 0) {
			this.items[workLogIndex] = workLog
		}

		return
	}
}
