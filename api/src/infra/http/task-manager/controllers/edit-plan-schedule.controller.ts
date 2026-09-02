import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Patch,
} from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditPlanUseCase } from '@/domain/task-manager/application/use-cases/edit-plan'
import { InvalidDatetimeError } from '@/domain/task-manager/application/use-cases/errors/invalid-datetime-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import {
	EditPlanScheduleDto,
	EditPlanScheduleParamDto,
	editPlanScheduleParamSchema,
	editPlanScheduleSchema,
} from './dto/edit-plan-schedule.dto'

@ApiTags('Plans')
@Controller('/api/plans/:planId/schedule')
export class EditPlanScheduleController {
	constructor(private editPlan: EditPlanUseCase) {}

	@ApiOperation({ summary: 'move or resize a plan' })
	@ApiNoContentResponse({ description: 'Plan schedule edited successfully' })
	@ApiBadRequestResponse({ description: 'Invalid interval', type: ApiErrorResponseDto })
	@ApiNotFoundResponse({ description: 'Plan not found', type: ApiErrorResponseDto })
	@Patch()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(editPlanScheduleSchema))
		body: EditPlanScheduleDto,

		@Param(new ZodValidationPipe(editPlanScheduleParamSchema))
		param: EditPlanScheduleParamDto,
	) {
		const result = await this.editPlan.execute({
			userId: user.id,
			planId: param.planId,
			startsAt: body.startsAt,
			endsAt: body.endsAt,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
				case NotAllowedError:
					throw new NotFoundException('Plan not found')

				case InvalidDatetimeError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
