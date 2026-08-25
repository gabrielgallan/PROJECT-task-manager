import {
	Controller,
	Delete,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	UnauthorizedException,
} from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { DeleteWorkLogUseCase } from '@/domain/task-manager/application/use-cases/delete-work-log'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { DeleteWorkLogDto, deleteWorkLogSchema } from './dto/delete-work-log.dto'

@Controller('/api/work-logs/:workLogId')
export class DeleteWorkLogController {
	constructor(private deleteWorkLog: DeleteWorkLogUseCase) {}

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
					throw new NotFoundException(error.message)

				case NotAllowedError:
					throw new UnauthorizedException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
