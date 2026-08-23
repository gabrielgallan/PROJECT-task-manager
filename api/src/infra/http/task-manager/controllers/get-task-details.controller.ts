import {
	Controller,
	Get,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
} from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { GetTaskDetailsUseCase } from '@/domain/task-manager/application/use-cases/get-task-details'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { TaskDetailsPresenter } from '../presenters/task-details-presenter'
import { GetTaskDetailsDto, getTaskDetailsSchema } from './dto/get-task-details.dto'

@Controller('/api/tasks/:taskId')
export class GetTaskDetailsController {
	constructor(private getTaskDetails: GetTaskDetailsUseCase) {}

	@Get()
	@HttpCode(200)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Param(new ZodValidationPipe(getTaskDetailsSchema))
		param: GetTaskDetailsDto,
	) {
		const result = await this.getTaskDetails.execute({
			userId: user.id,
			taskId: param.taskId,
		})

		if (result.isLeft()) {
			const error = result.value

			if (error instanceof ResourceNotFoundError || error instanceof NotAllowedError) {
				throw new NotFoundException('Task not found')
			}

			throw new InternalServerErrorException()
		}

		return { data: TaskDetailsPresenter.toHTTP(result.value.data) }
	}
}
