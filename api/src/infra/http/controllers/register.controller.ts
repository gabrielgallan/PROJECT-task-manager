import {
	Body,
	ConflictException,
	Controller,
	InternalServerErrorException,
	Post,
} from '@nestjs/common'
import { z } from 'zod'
import { UserAlreadyExistsError } from '@/domain/identity/application/use-cases/errors/user-already-exists-error'
import { RegisterUseCase } from '@/domain/identity/application/use-cases/register'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'

const registerBodySchema = z.object({
	name: z.string(),
	email: z.email(),
	password: z.string().min(6).max(18),
	jobTitle: z.string().optional(),
})

type RegisterBody = z.infer<typeof registerBodySchema>

@Controller()
export class RegisterController {
	constructor(private readonly register: RegisterUseCase) {}

	@Post('/api/users')
	async handle(
		@Body(new ZodValidationPipe(registerBodySchema))
		body: RegisterBody,
	) {
		const { name, email, password, jobTitle } = body

		const result = await this.register.execute({
			name,
			email,
			password,
			jobTitle,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case UserAlreadyExistsError:
					throw new ConflictException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
