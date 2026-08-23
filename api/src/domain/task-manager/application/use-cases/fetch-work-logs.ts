import { Injectable } from '@nestjs/common'
import { isBefore } from 'date-fns'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { type Either, left, right } from '@/core/types/either'
import type { WorkLog } from '../../enterprise/entities/work-log'
import { CategoriesRepository } from '../repositories/categories-repository'
import { TasksRepository } from '../repositories/tasks-repository'
import { WorkLogFilterInput, WorkLogsRepository } from '../repositories/work-logs-repository'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

type FetchWorkLogsUseCaseRequest = {
	userId: string
	from: Date
	to: Date
	filters?: WorkLogFilterInput
}

type WorkLogTaskSummary = {
	id: UniqueEntityID
	title: string
}

type WorkLogCategorySummary = {
	id: UniqueEntityID
	name: string
	color: string
}

type FetchWorkLogsUseCaseResponse = Either<
	InvalidDatetimeError,
	{
		data: Array<{
			workLog: WorkLog
			task: WorkLogTaskSummary | null
			category: WorkLogCategorySummary | null
		}>
	}
>

@Injectable()
export class FetchWorkLogsUseCase {
	constructor(
		private workLogsRepository: WorkLogsRepository,
		private tasksRepository: TasksRepository,
		private categoriesRepository: CategoriesRepository,
	) {}

	async execute({
		userId,
		from,
		to,
		filters,
	}: FetchWorkLogsUseCaseRequest): Promise<FetchWorkLogsUseCaseResponse> {
		if (!isBefore(from, to)) {
			return left(new InvalidDatetimeError('to must be after from'))
		}

		const [workLogs, tasks, categories] = await Promise.all([
			this.workLogsRepository.fetchAllByUserId(userId, { from, to }, filters),
			this.tasksRepository.fetchAllByUserId(userId),
			this.categoriesRepository.fetchAllByUserId(userId),
		])

		const tasksById = new Map(tasks.map((task) => [task.id.toString(), task]))
		const categoriesById = new Map(
			categories.map((category) => [category.id.toString(), category]),
		)

		const data = workLogs.map((workLog) => {
			const task = workLog.taskId ? tasksById.get(workLog.taskId.toString()) : undefined
			const category = workLog.categoryId
				? categoriesById.get(workLog.categoryId.toString())
				: undefined

			return {
				workLog,
				task: task ? { id: task.id, title: task.title } : null,
				category: category
					? { id: category.id, name: category.name, color: category.color }
					: null,
			}
		})

		return right({ data })
	}
}
