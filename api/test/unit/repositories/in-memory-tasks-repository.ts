import { PaginationInput } from '@/core/types/pagination'
import { normalizeSearchText } from '@/core/utils/text'
import {
	TaskFilterInput,
	TaskOption,
	TaskOptionsCursor,
	TaskOptionsInput,
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

	async findById(taskId: string) {
		const task = this.items.find((t) => t.id.toString() === taskId)

		return task ?? null
	}

	async fetchOptionsByUserId(userId: string, input: TaskOptionsInput) {
		let options: TaskOption[] = this.items
			.filter((task) => task.userId.toString() === userId)
			.map((task) => ({ id: task.id, title: task.title }))

		if (input.search) {
			const search = normalizeSearchText(input.search)

			options = options.filter((option) => normalizeSearchText(option.title).includes(search))
		}

		options.sort(compareTaskOptions)

		if (input.cursor) {
			const cursor = input.cursor

			options = options.filter((option) => isTaskOptionAfterCursor(option, cursor))
		}

		const page = options.slice(0, input.limit + 1)
		const hasNextPage = page.length > input.limit
		const items = page.slice(0, input.limit)
		const lastItem = items.at(-1)

		return {
			items,
			nextCursor:
				hasNextPage && lastItem
					? { title: lastItem.title, id: lastItem.id.toString() }
					: null,
		}
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

	async save(task: Task) {
		const taskIndex = this.items.findIndex((t) => t.id.toString() === task.id.toString())

		if (taskIndex >= 0) {
			this.items[taskIndex] = task
		}

		return
	}

	async delete(task: Task) {
		this.items = this.items.filter((t) => t.id.toString() !== task.id.toString())

		return
	}

	private filterTasks(tasks: Task[], filters?: TaskFilterInput): Task[] {
		if (!filters) {
			return tasks
		}

		let result = tasks

		if (filters.search) {
			const search = normalizeSearchText(filters.search)

			result = result.filter(
				(task) =>
					normalizeSearchText(task.title).includes(search) ||
					normalizeSearchText(task.description ?? '').includes(search),
			)
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
			const compareTitles = () =>
				normalizeSearchText(a.title).localeCompare(normalizeSearchText(b.title))

			if (sort.by === 'dueDate') {
				if (!a.dueDate && !b.dueDate) return compareTitles()
				if (!a.dueDate) return 1
				if (!b.dueDate) return -1
			}

			let comparison = 0

			switch (sort.by) {
				case 'title':
					comparison = compareTitles()
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
					comparison = a.dueDate!.getTime() - b.dueDate!.getTime()
					break
			}

			if (comparison === 0) return compareTitles()

			return sort.dir === 'asc' ? comparison : -comparison
		})
	}
}

function compareTaskOptions(a: TaskOption, b: TaskOption) {
	const titleComparison = normalizeSearchText(a.title).localeCompare(normalizeSearchText(b.title))

	return titleComparison || a.id.toString().localeCompare(b.id.toString())
}

function isTaskOptionAfterCursor(option: TaskOption, cursor: TaskOptionsCursor) {
	const titleComparison = normalizeSearchText(option.title).localeCompare(
		normalizeSearchText(cursor.title),
	)

	return (
		titleComparison > 0 ||
		(titleComparison === 0 && option.id.toString().localeCompare(cursor.id) > 0)
	)
}
