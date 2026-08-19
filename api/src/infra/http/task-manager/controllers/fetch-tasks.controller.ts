import { Controller, Get, HttpCode, InternalServerErrorException, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { FetchTasksUseCase } from '@/domain/task-manager/application/use-cases/fetch-tasks'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { Public } from '@/infra/auth/public.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { parsePaginationQuery } from '../utils/parse-pagination-query'
import { parseTaskSortQuery } from '../utils/parse-sort-query'
import { FetchTasksDto, fetchTasksSchema } from './dto/fetch-tasks.dto'

@ApiTags('Tasks')
@Public()
@Controller('/api/tasks')
export class FetchTasksController {
	constructor(private fetchTasks: FetchTasksUseCase) {}

	@ApiOperation({ summary: 'fetch user tasks' })
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
			data: result.value.data,
			meta: result.value.meta,
		}
	}
}
