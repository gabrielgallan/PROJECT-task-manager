import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Post,
} from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { CreatePlanUseCase } from '@/domain/task-manager/application/use-cases/create-plan'
import { InvalidDatetimeError } from '@/domain/task-manager/application/use-cases/errors/invalid-datetime-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { PlanPresenter } from '../presenters/plan-presenter'
import { CreatePlanDto, CreatePlanResponseDto, createPlanSchema } from './dto/create-plan.dto'

@ApiTags('Plans')
@Controller('/api/plans')
export class CreatePlanController {
	constructor(private createPlan: CreatePlanUseCase) {}

	@ApiOperation({ summary: 'create plan' })
	@ApiCreatedResponse({ description: 'Plan created successfully', type: CreatePlanResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid interval', type: ApiErrorResponseDto })
	@ApiNotFoundResponse({ description: 'Plan relation not found', type: ApiErrorResponseDto })
	@Post()
	@HttpCode(201)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(createPlanSchema))
		body: CreatePlanDto,
	) {
		const { taskId, categoryId, title, description, startsAt, endsAt } = body

		const result = await this.createPlan.execute({
			userId: user.id,
			taskId,
			categoryId,
			title,
			description,
			startsAt,
			endsAt,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
				case NotAllowedError:
					throw new NotFoundException('Plan relation not found')

				case InvalidDatetimeError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return { data: PlanPresenter.toHTTPCreated(result.value.plan) }
	}
}
