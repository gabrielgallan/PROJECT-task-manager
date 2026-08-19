import {
	Body,
	ConflictException,
	Controller,
	HttpCode,
	InternalServerErrorException,
	Post,
} from '@nestjs/common'
import { ApiConflictResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserAlreadyExistsError } from '@/domain/identity/application/use-cases/errors/user-already-exists-error'
import { RegisterUseCase } from '@/domain/identity/application/use-cases/register'
import { Public } from '@/infra/auth/public.decorator'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { RegisterDto, RegisterResposeDto, registerSchema } from './dto/register.dto'

@ApiTags('Profile')
@Public()
@Controller('/api/users')
export class RegisterController {
	constructor(private readonly register: RegisterUseCase) {}

	@ApiOperation({ summary: 'register' })
	@ApiCreatedResponse({ description: 'User successfully created', type: RegisterResposeDto })
	@ApiConflictResponse({
		description: 'User with email alrady registered',
		type: ApiErrorResponseDto,
	})
	@Post()
	@HttpCode(201)
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
