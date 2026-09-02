import {
	BadRequestException,
	Body,
	Controller,
	HttpCode,
	InternalServerErrorException,
	Post,
} from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import { CreateCategoryUseCase } from '@/domain/task-manager/application/use-cases/create-category'
import { InvalidCategoryError } from '@/domain/task-manager/application/use-cases/errors/invalid-category-error'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import { CategoryPresenter } from '../presenters/category-presenter'
import {
	CreateCategoryDto,
	CreateCategoryResponseDto,
	createCategorySchema,
} from './dto/create-category.dto'

@ApiTags('Categories')
@Controller('/api/categories')
export class CreateCategoryController {
	constructor(private createCategory: CreateCategoryUseCase) {}

	@ApiOperation({ summary: 'create category' })
	@ApiCreatedResponse({
		description: 'Category created successfully',
		type: CreateCategoryResponseDto,
	})
	@ApiBadRequestResponse({ description: 'Invalid category name or color', type: ApiErrorResponseDto })
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

		return { data: CategoryPresenter.toHTTP(result.value.category) }
	}
}
