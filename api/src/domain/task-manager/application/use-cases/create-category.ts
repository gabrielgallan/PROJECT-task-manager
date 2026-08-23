import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { type Either, left, right } from '@/core/types/either'
import { normalizeDisplayText } from '@/core/utils/text'
import { Category, isCategoryColor } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'
import { InvalidCategoryError } from './errors/invalid-category-error'

type CreateCategoryUseCaseRequest = {
	userId: string
	name: string
	color: string
}

type CreateCategoryUseCaseResponse = Either<InvalidCategoryError, { category: Category }>

@Injectable()
export class CreateCategoryUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		userId,
		name,
		color,
	}: CreateCategoryUseCaseRequest): Promise<CreateCategoryUseCaseResponse> {
		const normalizedName = normalizeDisplayText(name)

		if (normalizedName.length < 1 || normalizedName.length > 40) {
			return left(new InvalidCategoryError('Category name must be between 1 and 40 characters'))
		}

		if (!isCategoryColor(color)) {
			return left(new InvalidCategoryError('Invalid category color'))
		}

		const category = Category.create({
			userId: new UniqueEntityID(userId),
			name: normalizedName,
			color,
		})

		await this.categoriesRepository.create(category)

		return right({ category })
	}
}
