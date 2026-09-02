import {
	Controller,
	Get,
	HttpCode,
	InternalServerErrorException,
	NotFoundException,
	Param,
} from '@nestjs/common'
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { GetCategoryDeletionImpactUseCase } from '@/domain/task-manager/application/use-cases/get-category-deletion-impact'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { type UserPayload } from '@/infra/auth/user-payload'
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto'
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe'
import {
	GetCategoryDeletionImpactParamDto,
	GetCategoryDeletionImpactResponseDto,
	getCategoryDeletionImpactParamSchema,
} from './dto/get-category-deletion-impact.dto'

@ApiTags('Categories')
@Controller('/api/categories/:categoryId/deletion-impact')
export class GetCategoryDeletionImpactController {
	constructor(private getCategoryDeletionImpact: GetCategoryDeletionImpactUseCase) {}

	@ApiOperation({ summary: 'count plans and work logs affected by a category deletion' })
	@ApiOkResponse({
		description: 'Category deletion impact fetched successfully',
		type: GetCategoryDeletionImpactResponseDto,
	})
	@ApiNotFoundResponse({ description: 'Category not found', type: ApiErrorResponseDto })
	@Get()
	@HttpCode(200)
	async handle(
		@CurrentUser()
		user: UserPayload,

		@Param(new ZodValidationPipe(getCategoryDeletionImpactParamSchema))
		param: GetCategoryDeletionImpactParamDto,
	) {
		const result = await this.getCategoryDeletionImpact.execute({
			userId: user.id,
			categoryId: param.categoryId,
		})

		if (result.isLeft()) {
			const error = result.value

			switch (error.constructor) {
				case ResourceNotFoundError:
				case NotAllowedError:
					throw new NotFoundException('Category not found')

				default:
					throw new InternalServerErrorException()
			}
		}

		return { data: result.value }
	}
}
