import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { normalizeDisplayText } from '@/core/utils/text'
import { isCategoryColor } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'
import { InvalidCategoryError } from './errors/invalid-category-error'

type EditCategoryUseCaseRequest = {
	userId: string
	categoryId: string
	name?: string
	color?: string
}

type EditCategoryUseCaseResponse = Either<
	ResourceNotFoundError | NotAllowedError | InvalidCategoryError,
	null
>

@Injectable()
export class EditCategoryUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		userId,
		categoryId,
		name,
		color,
	}: EditCategoryUseCaseRequest): Promise<EditCategoryUseCaseResponse> {
		const category = await this.categoriesRepository.findById(categoryId)

		if (!category) {
			return left(new ResourceNotFoundError())
		}

		if (category.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		if (name !== undefined) {
			const normalizedName = normalizeDisplayText(name)

			if (normalizedName.length < 1 || normalizedName.length > 40) {
				return left(new InvalidCategoryError('Category name must be between 1 and 40 characters'))
			}

			category.name = normalizedName
		}

		if (color !== undefined) {
			if (!isCategoryColor(color)) {
				return left(new InvalidCategoryError('Invalid category color'))
			}

			category.color = color
		}

		await this.categoriesRepository.save(category)

		return right(null)
	}
}
