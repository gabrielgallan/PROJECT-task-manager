import { Controller, Get, HttpCode, InternalServerErrorException, Query } from '@nestjs/common'
import { FetchTasksUseCase } from '@/domain/task-manager/application/use-cases/fetch-tasks'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { TaskPresenter } from '../presenters/task-presenter'
import { parsePaginationQuery } from '../utils/parse-pagination-query'
import { parseTaskSortQuery } from '../utils/parse-sort-query'
import { FetchTasksDto, fetchTasksSchema } from './dto/fetch-tasks.dto'

@Controller('/api/tasks')
export class FetchTasksController {
	constructor(private fetchTasks: FetchTasksUseCase) {}

	@Get()
	@HttpCode(200)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Query(new ZodValidationPipe(fetchTasksSchema))
		query: FetchTasksDto,
	) {
		const pagination = parsePaginationQuery(query)

		const sort = parseTaskSortQuery(query)

		const result = await this.fetchTasks.execute({
			userId: user.id,
			filters: {
				search: query.search,
				status: query.status,
				priority: query.priority,
			},
			pagination,
			sort,
		})

		if (result.isLeft()) {
			throw new InternalServerErrorException()
		}

		return {
			data: result.value.data.map(TaskPresenter.toHTTP),
			meta: result.value.meta,
		}
	}
}
