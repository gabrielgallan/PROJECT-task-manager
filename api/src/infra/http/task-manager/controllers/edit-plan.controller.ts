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
	EditPlanDto,
	EditPlanParamDto,
	editPlanParamSchema,
	editPlanSchema,
} from './dto/edit-plan.dto'

@ApiTags('Plans')
@Controller('/api/plans/:planId')
export class EditPlanController {
	constructor(private editPlan: EditPlanUseCase) {}

	@ApiOperation({ summary: 'edit plan' })
	@ApiNoContentResponse({ description: 'Plan edited successfully' })
	@ApiBadRequestResponse({ description: 'Invalid interval', type: ApiErrorResponseDto })
	@ApiNotFoundResponse({ description: 'Plan not found', type: ApiErrorResponseDto })
	@Patch()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(editPlanSchema))
		body: EditPlanDto,

		@Param(new ZodValidationPipe(editPlanParamSchema))
		param: EditPlanParamDto,
	) {
		const { taskId, categoryId, title, description, startsAt, endsAt } = body

		const result = await this.editPlan.execute({
			userId: user.id,
			planId: param.planId,
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
