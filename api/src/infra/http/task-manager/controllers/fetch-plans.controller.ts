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
import { FetchPlansUseCase } from '@/domain/task-manager/application/use-cases/fetch-plans'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { PlanPresenter } from '../presenters/plan-presenter'
import { FetchPlansDto, FetchPlansResponseDto, fetchPlansSchema } from './dto/fetch-plans.dto'

@ApiTags('Plans')
@Controller('/api/plans')
export class FetchPlansController {
	constructor(private fetchPlans: FetchPlansUseCase) {}

	@ApiOperation({ summary: 'fetch plans in a calendar range' })
	@ApiOkResponse({ description: 'Plans fetched successfully', type: FetchPlansResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid date range', type: ApiErrorResponseDto })
	@Get()
	@HttpCode(200)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Query(new ZodValidationPipe(fetchPlansSchema))
		query: FetchPlansDto,
	) {
		const { from, to, taskId, categoryId, withoutTask, withoutCategory } = query

		const result = await this.fetchPlans.execute({
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
			data: result.value.data.map(PlanPresenter.toHTTP),
		}
	}
}
