import {
	BadRequestException,
	Controller,
	Get,
	HttpCode,
	InternalServerErrorException,
	Query,
} from '@nestjs/common'
import type {
	TaskOptionsCursor,
} from '@/domain/task-manager/application/repositories/tasks-repository'
import {
	FetchTaskOptionsUseCase,
} from '@/domain/task-manager/application/use-cases/fetch-task-options'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { TaskOptionPresenter } from '../presenters/task-option-presenter'
import {
	decodeTaskOptionsCursor,
	encodeTaskOptionsCursor,
} from '../utils/task-options-cursor'
import { FetchTaskOptionsDto, fetchTaskOptionsSchema } from './dto/fetch-task-options.dto'

@Controller('/api/tasks/options')
export class FetchTaskOptionsController {
	constructor(private fetchTaskOptions: FetchTaskOptionsUseCase) {}

	@Get()
	@HttpCode(200)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Query(new ZodValidationPipe(fetchTaskOptionsSchema))
		query: FetchTaskOptionsDto,
	) {
		let cursor: TaskOptionsCursor | undefined

		if (query.cursor) {
			const decodedCursor = decodeTaskOptionsCursor(query.cursor)

			if (!decodedCursor) {
				throw new BadRequestException('Invalid task options cursor')
			}

			cursor = decodedCursor
		}

		const result = await this.fetchTaskOptions.execute({
			userId: user.id,
			search: query.q,
			limit: query.limit,
			cursor,
		})

		if (result.isLeft()) {
			throw new InternalServerErrorException()
		}

		return {
			data: result.value.items.map(TaskOptionPresenter.toHTTP),
			meta: {
				nextCursor: result.value.nextCursor
					? encodeTaskOptionsCursor(result.value.nextCursor)
					: null,
			},
		}
	}
}
