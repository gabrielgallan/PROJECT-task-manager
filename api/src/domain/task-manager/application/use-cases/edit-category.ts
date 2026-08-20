import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { CategoriesRepository } from '../repositories/categories-repository'

type EditCategoryUseCaseRequest = {
	userId: string
	categoryId: string
	name?: string
	color?: string
}

type EditCategoryUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>

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

		if (name) category.name = name

		if (color) category.color = color

		await this.categoriesRepository.save(category)

		return right(null)
	}
}
