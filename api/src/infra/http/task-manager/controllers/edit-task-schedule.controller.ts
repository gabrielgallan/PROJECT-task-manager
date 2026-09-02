import {
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Patch,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditTaskUseCase } from '@/domain/task-manager/application/use-cases/edit-task'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { parseEditableDate } from '../utils/parse-editable-date'
import {
	EditTaskScheduleDto,
	EditTaskScheduleParamDto,
	editTaskScheduleParamSchema,
	editTaskScheduleSchema,
} from './dto/edit-task-schedule.dto'

@ApiTags('Tasks')
@Controller('/api/tasks/:taskId/schedule')
export class EditTaskScheduleController {
	constructor(private editTask: EditTaskUseCase) {}

	@ApiOperation({ summary: 'change task planned start and due date' })
	@ApiNoContentResponse({ description: 'Task schedule edited successfully' })
	@ApiNotFoundResponse({ description: 'Task not found', type: ApiErrorResponseDto })
	@Patch()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(editTaskScheduleSchema))
		body: EditTaskScheduleDto,

		@Param(new ZodValidationPipe(editTaskScheduleParamSchema))
		param: EditTaskScheduleParamDto,
	) {
		const result = await this.editTask.execute({
			userId: user.id,
			taskId: param.taskId,
			startDate: parseEditableDate(body.startDate),
			dueDate: parseEditableDate(body.dueDate),
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
				case NotAllowedError:
					throw new NotFoundException('Task not found')

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
