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
	EditTaskDto,
	EditTaskParamDto,
	editTaskParamSchema,
	editTaskSchema,
} from './dto/edit-task.dto'

@ApiTags('Tasks')
@Controller('/api/tasks/:taskId')
export class EditTaskController {
	constructor(private editTask: EditTaskUseCase) {}

	@ApiOperation({ summary: 'edit task' })
	@ApiNoContentResponse({ description: 'Task edited successfully' })
	@ApiNotFoundResponse({ description: 'Task not found', type: ApiErrorResponseDto })
	@Patch()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(editTaskSchema))
		body: EditTaskDto,

		@Param(new ZodValidationPipe(editTaskParamSchema))
		param: EditTaskParamDto,
	) {
		const { title, description, status, priority, startDate, dueDate } = body

		const result = await this.editTask.execute({
			userId: user.id,
			taskId: param.taskId,
			title,
			description,
			status,
			priority,
			startDate: parseEditableDate(startDate),
			dueDate: parseEditableDate(dueDate),
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
