import {
	BadRequestException,
	Controller,
	Get,
	HttpCode,
	InternalServerErrorException,
	Query,
} from '@nestjs/common'
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { InvalidDatetimeError } from '@/domain/task-manager/application/use-cases/errors/invalid-datetime-error'
import { FetchWorkLogsUseCase } from '@/domain/task-manager/application/use-cases/fetch-work-logs'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { WorkLogPresenter } from '../presenters/work-log-presenter'
import {
	FetchWorkLogsDto,
	FetchWorkLogsResponseDto,
	fetchWorkLogsSchema,
} from './dto/fetch-work-logs.dto'

@ApiTags('Work Logs')
@Controller('/api/work-logs')
export class FetchWorkLogsController {
	constructor(private fetchWorkLogs: FetchWorkLogsUseCase) {}

	@ApiOperation({ summary: 'fetch work logs in a calendar range' })
	@ApiOkResponse({ description: 'Work logs fetched successfully', type: FetchWorkLogsResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid date range', type: ApiErrorResponseDto })
	@Get()
	@HttpCode(200)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Query(new ZodValidationPipe(fetchWorkLogsSchema))
		query: FetchWorkLogsDto,
	) {
		const { from, to, taskId, categoryId, withoutTask, withoutCategory } = query

		const result = await this.fetchWorkLogs.execute({
			userId: user.id,
			from,
			to,
			filters: {
				taskIds: taskId,
				categoryIds: categoryId,
				withoutTask,
				withoutCategory,
			},
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case InvalidDatetimeError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return {
			data: result.value.data.map(WorkLogPresenter.toHTTP),
		}
	}
}
