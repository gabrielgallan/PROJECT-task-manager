import { WorkLogData } from '@/domain/task-manager/enterprise/entities/value-objects/work-log-data'
import { WorkLog } from '@/domain/task-manager/enterprise/entities/work-log'
import { CreatedWorkLogDto } from '../dtos/created-work-log.dto'
import { WorkLogDto } from '../dtos/work-log.dto'

export class WorkLogPresenter {
	static toHTTP(workLog: WorkLogData): WorkLogDto {
		return {
			id: workLog.id,
			task: workLog.task,
			category: workLog.category,
			title: workLog.title,
			description: workLog.description,
			startsAt: workLog.startsAt,
			endsAt: workLog.endsAt,
			createdAt: workLog.createdAt,
			updatedAt: workLog.updatedAt,
		}
	}

	static toHTTPCreated(workLog: WorkLog): CreatedWorkLogDto {
		return {
			id: workLog.id.toString(),
			taskId: workLog.taskId?.toString() ?? null,
			categoryId: workLog.categoryId?.toString() ?? null,
			title: workLog.title,
			description: workLog.description ?? null,
			startsAt: workLog.startsAt,
			endsAt: workLog.endsAt,
			createdAt: workLog.createdAt,
			updatedAt: workLog.updatedAt ?? null,
		}
	}
}
