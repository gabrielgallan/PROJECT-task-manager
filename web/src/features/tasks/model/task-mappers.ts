import type { CreateTaskRequest } from '@/api/create-task'
import type { EditTaskRequest } from '@/api/edit-task'
import type { TaskDto } from './task-api-types'
import { localToTaskDate, taskDateToLocal } from './task-dates'
import type { TaskFormValues } from './task-schema'
import type { Task } from './task-types'

export function toTask(dto: TaskDto): Task {
	return {
		...dto,
		description: dto.description ?? undefined,
		startDate: taskDateToLocal(dto.startDate),
		dueDate: taskDateToLocal(dto.dueDate),
		createdAt: new Date(dto.createdAt),
		updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
	}
}

export function taskFormValues(task?: Task): TaskFormValues {
	return {
		title: task?.title ?? '', description: task?.description ?? '',
		status: task?.status ?? 'BACKLOG', priority: task?.priority ?? 'LOW',
		startDate: localToTaskDate(task?.startDate), dueDate: localToTaskDate(task?.dueDate),
	}
}

export function taskCreateBody(values: TaskFormValues): CreateTaskRequest {
	return {
		...values, description: values.description.trim() || undefined,
		startDate: values.startDate ?? undefined, dueDate: values.dueDate ?? undefined,
	}
}

export function taskChanges(values: TaskFormValues, original: TaskFormValues) {
	const changes: Omit<EditTaskRequest, 'taskId'> = {}
	if (values.title.trim() !== original.title.trim()) changes.title = values.title.trim()
	if (values.description.trim() !== original.description.trim()) {
		changes.description = values.description.trim() || null
	}
	if (values.status !== original.status) changes.status = values.status
	if (values.priority !== original.priority) changes.priority = values.priority
	if (values.startDate !== original.startDate) changes.startDate = values.startDate
	if (values.dueDate !== original.dueDate) changes.dueDate = values.dueDate
	return changes
}
