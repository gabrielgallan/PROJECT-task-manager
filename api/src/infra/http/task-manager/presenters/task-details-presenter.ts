import type {
	TaskActivityEntry,
	TaskDetails,
} from '@/domain/task-manager/application/use-cases/get-task-details'
import type { TaskActivityDto, TaskDetailsDto } from '../dtos/task-details.dto'
import { TaskPresenter } from './task-presenter'

export class TaskDetailsPresenter {
	static toHTTP(details: TaskDetails): TaskDetailsDto {
		return {
			task: TaskPresenter.toHTTP(details.task),
			summary: details.summary,
			activity: details.activity.map(TaskDetailsPresenter.activityToHTTP),
		}
	}

	private static activityToHTTP(activity: TaskActivityEntry): TaskActivityDto {
		const base = {
			id: activity.id.toString(),
			title: activity.title,
			startsAt: activity.startsAt,
			endsAt: activity.endsAt,
		}

		if (activity.kind === 'plan') {
			return {
				...base,
				kind: activity.kind,
				isConfirmed: activity.isConfirmed,
			}
		}

		return { ...base, kind: activity.kind }
	}
}
