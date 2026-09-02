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
import {
	EditTaskStatusDto,
	EditTaskStatusParamDto,
	editTaskStatusParamSchema,
	editTaskStatusSchema,
} from './dto/edit-task-status.dto'

@ApiTags('Tasks')
@Controller('/api/tasks/:taskId/status')
export class EditTaskStatusController {
	constructor(private editTask: EditTaskUseCase) {}

	@ApiOperation({ summary: 'move task between board columns' })
	@ApiNoContentResponse({ description: 'Task status edited successfully' })
	@ApiNotFoundResponse({ description: 'Task not found', type: ApiErrorResponseDto })
	@Patch()
	@HttpCode(204)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(editTaskStatusSchema))
		body: EditTaskStatusDto,

		@Param(new ZodValidationPipe(editTaskStatusParamSchema))
		param: EditTaskStatusParamDto,
	) {
		const result = await this.editTask.execute({
			userId: user.id,
			taskId: param.taskId,
			status: body.status,
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
