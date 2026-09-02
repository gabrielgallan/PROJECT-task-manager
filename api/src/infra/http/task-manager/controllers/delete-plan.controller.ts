import {
	Controller,
	Delete,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { DeletePlanUseCase } from '@/domain/task-manager/application/use-cases/delete-plan'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { DeletePlanParamDto, deletePlanParamSchema } from './dto/delete-plan.dto'

@ApiTags('Plans')
@Controller('/api/plans/:planId')
export class DeletePlanController {
	constructor(private deletePlan: DeletePlanUseCase) {}

	@ApiOperation({ summary: 'delete plan' })
	@ApiNoContentResponse({ description: 'Plan deleted successfully' })
	@ApiNotFoundResponse({ description: 'Plan not found', type: ApiErrorResponseDto })
	@Delete()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Param(new ZodValidationPipe(deletePlanParamSchema))
		param: DeletePlanParamDto,
	) {
		const result = await this.deletePlan.execute({
			userId: user.id,
			planId: param.planId,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
				case NotAllowedError:
					throw new NotFoundException('Plan not found')

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
