import {
	WorkLogDateRangeInput,
	WorkLogFilterInput,
	WorkLogsRepository,
} from '@/domain/task-manager/application/repositories/work-logs-repository'
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

	async fetchAllByUserId(
		userId: string,
		{ from, to }: WorkLogDateRangeInput,
		filters?: WorkLogFilterInput,
	) {
		let workLogs = this.items.filter(
			(workLog) =>
				workLog.userId.toString() === userId && workLog.startsAt < to && workLog.endsAt > from,
		)

		const hasTaskFilter = Boolean(filters?.taskIds?.length || filters?.withoutTask)

		if (hasTaskFilter) {
			workLogs = workLogs.filter((workLog) => {
				const matchesTask = workLog.taskId
					? filters?.taskIds?.includes(workLog.taskId.toString())
					: filters?.withoutTask

				return Boolean(matchesTask)
			})
		}

		const hasCategoryFilter = Boolean(filters?.categoryIds?.length || filters?.withoutCategory)

		if (hasCategoryFilter) {
			workLogs = workLogs.filter((workLog) => {
				const matchesCategory = workLog.categoryId
					? filters?.categoryIds?.includes(workLog.categoryId.toString())
					: filters?.withoutCategory

				return Boolean(matchesCategory)
			})
		}

		return workLogs.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
	}

	async fetchAllByTaskId(userId: string, taskId: string) {
		return this.items
			.filter(
				(workLog) =>
					workLog.userId.toString() === userId && workLog.taskId?.toString() === taskId,
			)
			.sort(
				(a, b) =>
					b.startsAt.getTime() - a.startsAt.getTime() ||
					a.id.toString().localeCompare(b.id.toString()),
			)
	}

	async save(workLog: WorkLog) {
		const workLogIndex = this.items.findIndex((w) => w.id.toString() === workLog.id.toString())

		if (workLogIndex >= 0) {
			this.items[workLogIndex] = workLog
		}

		return
	}

	async delete(workLog: WorkLog) {
		this.items = this.items.filter((w) => w.id.toString() !== workLog.id.toString())

		return
	}
}
