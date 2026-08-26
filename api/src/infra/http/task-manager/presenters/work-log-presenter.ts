import { WorkLogData } from '@/domain/task-manager/enterprise/entities/value-objects/work-log-data'
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
}
