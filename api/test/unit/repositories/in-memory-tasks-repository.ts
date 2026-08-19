import { PaginationInput } from '@/core/types/pagination'
import {
	TaskFilterInput,
	TaskSortInput,
	TasksRepository,
} from '@/domain/task-manager/application/repositories/tasks-repository'
import { Task, TaskPriority, TaskStatus } from '@/domain/task-manager/enterprise/entities/task'

export class InMemoryTasksRepository implements TasksRepository {
	public items: Task[] = []

	async create(task: Task) {
		this.items.push(task)

		return
	}

	async fetchAllByUserId(userId: string, filters?: TaskFilterInput, sort?: TaskSortInput) {
		let tasks = this.items.filter((task) => task.userId.toString() === userId)

		tasks = this.filterTasks(tasks, filters)

		tasks = this.sortTasks(tasks, sort)

		return tasks
	}

	async listByUserId(
		userId: string,
		{ limit, page }: PaginationInput,
		filters?: TaskFilterInput,
		sort?: TaskSortInput,
	) {
		let tasks = this.items.filter((task) => task.userId.toString() === userId)

		tasks = this.filterTasks(tasks, filters)

		tasks = this.sortTasks(tasks, sort)

		const total = tasks.length

		tasks = tasks.slice((page - 1) * limit, page * limit)

		return {
			data: tasks,
			meta: {
				limit,
				page,
				total,
			},
		}
	}

	private filterTasks(tasks: Task[], filters?: TaskFilterInput): Task[] {
		if (!filters) {
			return tasks
		}

		let result = tasks

		if (filters.search) {
			const search = filters.search.toLowerCase()

			result = result.filter((task) => task.title.toLowerCase().includes(search))
		}

		if (filters.status?.length) {
			result = result.filter((task) => filters.status?.includes(task.status))
		}

		if (filters.priority?.length) {
			result = result.filter((task) => filters.priority?.includes(task.priority))
		}

		return result
	}

	private sortTasks(tasks: Task[], sort?: TaskSortInput): Task[] {
		if (!sort) {
			return tasks
		}

		const priorityOrder: Record<TaskPriority, number> = {
			LOW: 1,
			MEDIUM: 2,
			HIGH: 3,
			CRITICAL: 4,
		}

		const statusOrder: Record<TaskStatus, number> = {
			BACKLOG: 1,
			IN_PROGRESS: 2,
			DONE: 3,
		}

		return tasks.sort((a, b) => {
			let comparison = 0

			switch (sort.by) {
				case 'title':
					comparison = a.title.localeCompare(b.title)
					break

				case 'priority':
					comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
					break

				case 'status':
					comparison = statusOrder[a.status] - statusOrder[b.status]
					break

				case 'updatedAt':
					comparison = (a.updatedAt?.getTime() ?? 0) - (b.updatedAt?.getTime() ?? 0)
					break

				case 'dueDate':
					comparison = (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0)
					break
			}

			return sort.dir === 'asc' ? comparison : -comparison
		})
	}
}
