import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Post,
	UnauthorizedException,
} from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { CreateWorkLogUseCase } from '@/domain/task-manager/application/use-cases/create-work-log'
import { InvalidDatetimeError } from '@/domain/task-manager/application/use-cases/errors/invalid-datetime-error'
import { InvalidTimeZoneError } from '@/domain/task-manager/application/use-cases/errors/invalid-time-zone-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CreateWorkLogDto, createWorkLogSchema } from './dto/create-work-log.dto'

@Controller('/api/work-logs')
export class CreateWorkLogController {
	constructor(private createWorkLog: CreateWorkLogUseCase) {}

	@Post()
	@HttpCode(201)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(createWorkLogSchema))
		body: CreateWorkLogDto,
	) {
		const { taskId, categoryId, title, description, startsAt, endsAt, timeZone } = body

		const result = await this.createWorkLog.execute({
			userId: user.id,
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

		return body
	}
}
