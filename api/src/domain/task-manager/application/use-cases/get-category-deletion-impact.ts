import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { CategoriesRepository } from '../repositories/categories-repository'

type GetCategoryDeletionImpactUseCaseRequest = {
	userId: string
	categoryId: string
}

type GetCategoryDeletionImpactUseCaseResponse = Either<
	ResourceNotFoundError | NotAllowedError,
	{ plansCount: number; workLogsCount: number }
>

@Injectable()
export class GetCategoryDeletionImpactUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		userId,
		categoryId,
	}: GetCategoryDeletionImpactUseCaseRequest): Promise<GetCategoryDeletionImpactUseCaseResponse> {
		const category = await this.categoriesRepository.findById(categoryId)

		if (!category) {
			return left(new ResourceNotFoundError())
		}

		if (category.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		const { plansCount, workLogsCount } =
			await this.categoriesRepository.countRelatedRecords(categoryId)

		return right({
			plansCount,
			workLogsCount,
		})
	}
}
