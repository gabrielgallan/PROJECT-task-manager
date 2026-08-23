import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	Post,
} from '@nestjs/common'
import { CreateCategoryUseCase } from '@/domain/task-manager/application/use-cases/create-category'
import { InvalidCategoryError } from '@/domain/task-manager/application/use-cases/errors/invalid-category-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CreateCategoryDto, createCategorySchema } from './dto/create-cateogory.dto'

@Controller('/api/categories')
export class CreateCategoryController {
	constructor(private createCategory: CreateCategoryUseCase) {}

	@Post()
	@HttpCode(201)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Body(new ZodValidationPipe(createCategorySchema))
		body: CreateCategoryDto,
	) {
		const { name, color } = body

		const result = await this.createCategory.execute({
			userId: user.id,
			name,
			color,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case InvalidCategoryError:
					throw new BadRequestException(error.message)

				default:
					throw new InternalServerErrorException()
			}
		}

		return
	}
}
