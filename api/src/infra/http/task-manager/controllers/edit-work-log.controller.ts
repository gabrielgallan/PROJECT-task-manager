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
import { EditWorkLogUseCase } from '@/domain/task-manager/application/use-cases/edit-work-log'
import { InvalidDatetimeError } from '@/domain/task-manager/application/use-cases/errors/invalid-datetime-error'
import { InvalidTimeZoneError } from '@/domain/task-manager/application/use-cases/errors/invalid-time-zone-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import {
	EditWorkLogDto,
	EditWorkLogParamDto,
	editWorkLogParamSchema,
	editWorkLogSchema,
} from './dto/edit-work-log.dto'

@ApiTags('Work Logs')
@Controller('/api/work-logs/:workLogId')
export class EditWorkLogController {
	constructor(private editWorkLog: EditWorkLogUseCase) {}

	@ApiOperation({ summary: 'edit work log' })
	@ApiNoContentResponse({ description: 'Work log edited successfully' })
	@ApiBadRequestResponse({
		description: 'Invalid interval, time zone or overlapping work log',
		type: ApiErrorResponseDto,
	})
	@ApiNotFoundResponse({ description: 'Work log not found', type: ApiErrorResponseDto })
	@Patch()
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
				case NotAllowedError:
					throw new NotFoundException('Work log not found')

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
