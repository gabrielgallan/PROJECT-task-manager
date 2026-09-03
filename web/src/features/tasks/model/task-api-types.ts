import type { TaskPriority, TaskStatus } from './task-types'

export type DateOnly = string
export type IsoDateTime = string
export type TaskSortBy = 'title' | 'status' | 'priority' | 'updatedAt' | 'dueDate'

export interface TaskDto {
	id: string
	title: string
	description: string | null
	status: TaskStatus
	priority: TaskPriority
	startDate: IsoDateTime | null
	dueDate: IsoDateTime | null
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

export interface TaskOptionDto { id: string; title: string }
export type TaskActivityDto = {
	id: string
	title: string
	startsAt: IsoDateTime
	endsAt: IsoDateTime
} & ({ kind: 'plan'; isConfirmed: boolean } | { kind: 'work-log' })

export interface TaskDetailsDto {
	task: TaskDto
	summary: { plannedMinutes: number; loggedMinutes: number }
	activity: TaskActivityDto[]
}

export interface PaginationMeta { limit: number; page: number; total: number }
export interface TaskReadOptions { signal?: AbortSignal }
export interface TaskIdRequest { taskId: string }
