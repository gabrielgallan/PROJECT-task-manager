import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { CategoriesRepository } from '../repositories/categories-repository'

type DeleteCategoryUseCaseRequest = {
	userId: string
	categoryId: string
}

type DeleteCategoryUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>

@Injectable()
export class DeleteCategoryUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		userId,
		categoryId,
	}: DeleteCategoryUseCaseRequest): Promise<DeleteCategoryUseCaseResponse> {
		const category = await this.categoriesRepository.findById(categoryId)

		if (!category) {
			return left(new ResourceNotFoundError())
		}

		if (category.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		await this.categoriesRepository.delete(category)

		return right(null)
	}
}
