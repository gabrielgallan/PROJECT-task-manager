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
import { DeleteWorkLogUseCase } from '@/domain/task-manager/application/use-cases/delete-work-log'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { DeleteWorkLogDto, deleteWorkLogSchema } from './dto/delete-work-log.dto'

@ApiTags('Work Logs')
@Controller('/api/work-logs/:workLogId')
export class DeleteWorkLogController {
	constructor(private deleteWorkLog: DeleteWorkLogUseCase) {}

	@ApiOperation({ summary: 'delete work log' })
	@ApiNoContentResponse({ description: 'Work log deleted successfully' })
	@ApiNotFoundResponse({ description: 'Work log not found', type: ApiErrorResponseDto })
	@Delete()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Param(new ZodValidationPipe(deleteWorkLogSchema))
		param: DeleteWorkLogDto,
	) {
		const result = await this.deleteWorkLog.execute({
			userId: user.id,
			workLogId: param.workLogId,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
				case NotAllowedError:
					throw new NotFoundException('Work log not found')

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
