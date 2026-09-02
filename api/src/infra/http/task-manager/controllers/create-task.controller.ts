import { Body, Controller, HttpCode, InternalServerErrorException, Post } from '@nestjs/common'
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateTaskUseCase } from '@/domain/task-manager/application/use-cases/create-task'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { TaskPresenter } from '../presenters/task-presenter'
import { CreateTaskDto, CreateTaskResponseDto, createTaskSchema } from './dto/create-task.dto'

@ApiTags('Tasks')
@Controller('/api/tasks')
export class CreateTaskController {
	constructor(private createTask: CreateTaskUseCase) {}

	@ApiOperation({ summary: 'create task' })
	@ApiCreatedResponse({ description: 'Task created successfully', type: CreateTaskResponseDto })
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

		return { data: TaskPresenter.toHTTP(result.value.task) }
	}
}
