import {
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
import { EditTaskUseCase } from '@/domain/task-manager/application/use-cases/edit-task'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import {
	EditTaskDto,
	EditTaskParamDto,
	editTaskParamSchema,
	editTaskSchema,
} from './dto/edit-task.dto'

@Controller('/api/tasks/:taskId')
export class EditTaskController {
	constructor(private editTask: EditTaskUseCase) {}

	@Put()
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
			startDate: startDate ? new Date(startDate) : undefined,
			dueDate: dueDate ? new Date(dueDate) : undefined,
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
