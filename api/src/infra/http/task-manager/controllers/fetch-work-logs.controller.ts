import {
	BadRequestException,
	Controller,
	Get,
	HttpCode,
	InternalServerErrorException,
	Query,
} from '@nestjs/common'
import { InvalidDatetimeError } from '@/domain/task-manager/application/use-cases/errors/invalid-datetime-error'
import { FetchWorkLogsUseCase } from '@/domain/task-manager/application/use-cases/fetch-work-logs'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { FetchWorkLogsDto, fetchWorkLogsSchema } from './dto/fetch-work-logs.dto'

@Controller('/api/work-logs')
export class FetchWorkLogsController {
	constructor(private fetchWorkLogs: FetchWorkLogsUseCase) {}

	@Get()
	@HttpCode(200)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Query(new ZodValidationPipe(fetchWorkLogsSchema))
		query: FetchWorkLogsDto,
	) {
		const { from, to, filters } = query

		const result = await this.fetchWorkLogs.execute({
			userId: user.id,
			from,
			to,
			filters,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case InvalidDatetimeError:
					throw new BadRequestException()

				default:
					throw new InternalServerErrorException()
			}
		}

		return {
			data: result.value.data,
		}
	}
}
