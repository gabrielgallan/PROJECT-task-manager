import type { TaskDto } from './task.dto'

export type PlanTaskActivityDto = {
	id: string
	kind: 'plan'
	title: string
	startsAt: Date
	endsAt: Date
	isConfirmed: boolean
}

export type WorkLogTaskActivityDto = {
	id: string
	kind: 'work-log'
	title: string
	startsAt: Date
	endsAt: Date
}

export type TaskActivityDto = PlanTaskActivityDto | WorkLogTaskActivityDto

export class TaskDetailsDto {
	task!: TaskDto
	summary!: {
		plannedMinutes: number
		loggedMinutes: number
	}
	activity!: TaskActivityDto[]
}
