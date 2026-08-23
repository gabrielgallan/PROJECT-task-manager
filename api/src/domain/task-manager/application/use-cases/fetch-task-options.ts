import { Injectable } from '@nestjs/common'
import type { CursorPaginatedList } from '@/core/types/cursor-pagination'
import { type Either, right } from '@/core/types/either'
import {
	TaskOption,
	TaskOptionsCursor,
	TasksRepository,
} from '../repositories/tasks-repository'

type FetchTaskOptionsUseCaseRequest = {
	userId: string
	search?: string
	limit: number
	cursor?: TaskOptionsCursor
}

type FetchTaskOptionsUseCaseResponse = Either<
	null,
	CursorPaginatedList<TaskOption, TaskOptionsCursor>
>

@Injectable()
export class FetchTaskOptionsUseCase {
	constructor(private tasksRepository: TasksRepository) {}

	async execute({
		userId,
		search,
		limit,
		cursor,
	}: FetchTaskOptionsUseCaseRequest): Promise<FetchTaskOptionsUseCaseResponse> {
		const result = await this.tasksRepository.fetchOptionsByUserId(userId, {
			search,
			limit,
			cursor,
		})

		return right(result)
	}
}
