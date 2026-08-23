import { Body, Controller, HttpCode, InternalServerErrorException, Post } from '@nestjs/common'
import { CreateTaskUseCase } from '@/domain/task-manager/application/use-cases/create-task'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CreateTaskDto, createTaskSchema } from './dto/create-task.dto'

@Controller('/api/tasks')
export class CreateTaskController {
	constructor(private createTask: CreateTaskUseCase) {}

	@Post()
	@HttpCode(201)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(createTaskSchema))
		body: CreateTaskDto,
	) {
		const { title, description, status, priority, startDate, dueDate } = body

		const result = await this.createTask.execute({
			userId: user.id,
			title,
			description,
			status,
			priority,
			startDate: startDate ? new Date(startDate) : undefined,
			dueDate: dueDate ? new Date(dueDate) : undefined,
		})

		if (result.isLeft()) {
			throw new InternalServerErrorException()
		}

		return
	}
}
