import {
	Body,
	ConflictException,
	Controller,
	InternalServerErrorException,
	Post,
} from '@nestjs/common'
import { UserAlreadyExistsError } from '@/domain/identity/application/use-cases/errors/user-already-exists-error'
import { RegisterUseCase } from '@/domain/identity/application/use-cases/register'
import { Public } from '@/infra/auth/public.decorator'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { type RegisterDto, registerSchema } from './dto/register.dto'

@Controller()
@Public()
export class RegisterController {
	constructor(private readonly register: RegisterUseCase) {}

	@Post('/api/users')
	async handle(
		@Body(new ZodValidationPipe(registerSchema))
		body: RegisterDto,
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

		return { success: true }
	}
}
