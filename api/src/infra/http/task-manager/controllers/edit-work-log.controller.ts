import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Put,
	UnauthorizedException,
} from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditWorkLogUseCase } from '@/domain/task-manager/application/use-cases/edit-work-log'
import { InvalidDatetimeError } from '@/domain/task-manager/application/use-cases/errors/invalid-datetime-error'
import { InvalidTimeZoneError } from '@/domain/task-manager/application/use-cases/errors/invalid-time-zone-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import {
	EditWorkLogDto,
	EditWorkLogParamDto,
	editWorkLogParamSchema,
	editWorkLogSchema,
} from './dto/edit-work-log.dto'

@Controller('/api/work-logs/:workLogId')
export class EditWorkLogController {
	constructor(private editWorkLog: EditWorkLogUseCase) {}

	@Put()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(editWorkLogSchema))
		body: EditWorkLogDto,

		@Param(new ZodValidationPipe(editWorkLogParamSchema))
		param: EditWorkLogParamDto,
	) {
		const { taskId, categoryId, title, description, startsAt, endsAt, timeZone } = body

		const result = await this.editWorkLog.execute({
			userId: user.id,
			workLogId: param.workLogId,
			taskId,
			categoryId,
			title,
			description,
			startsAt,
			endsAt,
			timeZone,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
					throw new NotFoundException(error.message)

				case NotAllowedError:
					throw new UnauthorizedException(error.message)

				case InvalidDatetimeError:
					throw new BadRequestException(error.message)

				case InvalidTimeZoneError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
