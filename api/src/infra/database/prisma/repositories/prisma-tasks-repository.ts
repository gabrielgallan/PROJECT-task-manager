import { Injectable } from '@nestjs/common'
import type { Prisma } from 'generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { PaginationInput } from '@/core/types/pagination'
import { normalizeSearchText } from '@/core/utils/text'
import {
	TaskFilterInput,
	TaskOption,
	TaskOptionsCursor,
	TaskOptionsInput,
	TaskSortInput,
	TasksRepository,
} from '@/domain/task-manager/application/repositories/tasks-repository'
import {
	Task,
	TaskPriority,
	TaskStatus,
} from '@/domain/task-manager/enterprise/entities/task'
import { PrismaTaskPriorityMapper } from '../mappers/enums/prisma-task-priority-mapper'
import { PrismaTaskStatusMapper } from '../mappers/enums/prisma-task-status-mapper'
import { PrismaTaskMapper } from '../mappers/prisma-task-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaTasksRepository implements TasksRepository {
	constructor(private prisma: PrismaService) {}

	async create(task: Task) {
		await this.prisma.task.create({
			data: PrismaTaskMapper.toPrisma(task),
		})
	}

	async findById(taskId: string) {
		const task = await this.prisma.task.findUnique({
			where: { id: taskId },
		})

		return task ? PrismaTaskMapper.toDomain(task) : null
	}

	async fetchOptionsByUserId(userId: string, input: TaskOptionsInput) {
		const records = await this.prisma.task.findMany({
			where: { userId },
			select: { id: true, title: true },
		})
		let options: TaskOption[] = records.map((record) => ({
			id: new UniqueEntityID(record.id),
			title: record.title,
		}))

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

	async listByUserId(
		userId: string,
		{ limit, page }: PaginationInput,
		filters?: TaskFilterInput,
		sort?: TaskSortInput,
	) {
		const tasks = await this.fetchFilteredTasks(userId, filters, sort)
		const total = tasks.length

		return {
			data: tasks.slice((page - 1) * limit, page * limit),
			meta: { limit, page, total },
		}
	}

	async fetchAllByUserId(userId: string, filters?: TaskFilterInput, sort?: TaskSortInput) {
		return this.fetchFilteredTasks(userId, filters, sort)
	}

	async save(task: Task) {
		await this.prisma.task.update({
			where: { id: task.id.toString() },
			data: PrismaTaskMapper.toPrisma(task),
		})
	}

	async delete(task: Task) {
		await this.prisma.task.delete({
			where: { id: task.id.toString() },
		})
	}

	private async fetchFilteredTasks(
		userId: string,
		filters?: TaskFilterInput,
		sort?: TaskSortInput,
	) {
		const records = await this.prisma.task.findMany({
			where: this.buildWhere(userId, filters),
		})
		let tasks = records.map(PrismaTaskMapper.toDomain)

		if (filters?.search) {
			const search = normalizeSearchText(filters.search)

			tasks = tasks.filter(
				(task) =>
					normalizeSearchText(task.title).includes(search) ||
					normalizeSearchText(task.description ?? '').includes(search),
			)
		}

		return this.sortTasks(tasks, sort)
	}

	private buildWhere(userId: string, filters?: TaskFilterInput): Prisma.TaskWhereInput {
		return {
			userId,
			status: filters?.status?.length
				? { in: filters.status.map(PrismaTaskStatusMapper.toPrisma) }
				: undefined,
			priority: filters?.priority?.length
				? { in: filters.priority.map(PrismaTaskPriorityMapper.toPrisma) }
				: undefined,
		}
	}

	private sortTasks(tasks: Task[], sort?: TaskSortInput) {
		if (!sort) return tasks

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
