import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Post,
} from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiConflictResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { ConfirmPlanUseCase } from '@/domain/task-manager/application/use-cases/confirm-plan'
import { InvalidDatetimeError } from '@/domain/task-manager/application/use-cases/errors/invalid-datetime-error'
import { InvalidTimeZoneError } from '@/domain/task-manager/application/use-cases/errors/invalid-time-zone-error'
import { PlanAlreadyConfirmedError } from '@/domain/task-manager/application/use-cases/errors/plan-already-confirmed-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import {
	ConfirmPlanDto,
	ConfirmPlanParamDto,
	confirmPlanParamSchema,
	confirmPlanSchema,
} from './dto/confirm-plan.dto'

@ApiTags('Plans')
@Controller('/api/plans/:planId/record-as-done')
export class ConfirmPlanController {
	constructor(private confirmPlan: ConfirmPlanUseCase) {}

	@ApiOperation({ summary: 'record a plan as done, creating its work log' })
	@ApiNoContentResponse({ description: 'Plan recorded as done successfully' })
	@ApiBadRequestResponse({
		description: 'Invalid interval, time zone or overlapping work log',
		type: ApiErrorResponseDto,
	})
	@ApiNotFoundResponse({ description: 'Plan not found', type: ApiErrorResponseDto })
	@ApiConflictResponse({ description: 'Plan is already confirmed', type: ApiErrorResponseDto })
	@Post()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(confirmPlanSchema))
		body: ConfirmPlanDto,

		@Param(new ZodValidationPipe(confirmPlanParamSchema))
		param: ConfirmPlanParamDto,
	) {
		const result = await this.confirmPlan.execute({
			userId: user.id,
			planId: param.planId,
			timeZone: body.timeZone,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
				case NotAllowedError:
					throw new NotFoundException('Plan not found')

				case PlanAlreadyConfirmedError:
					throw new ConflictException(error.message)

				case InvalidDatetimeError:
				case InvalidTimeZoneError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
