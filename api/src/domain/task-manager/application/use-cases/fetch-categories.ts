import { Injectable } from '@nestjs/common'
import { type Either, right } from '@/core/types/either'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'

type FetchCategoriesUseCaseRequest = {
	userId: string
}

type FetchCategoriesUseCaseResponse = Either<null, { data: Category[] }>

@Injectable()
export class FetchCategoriesUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		userId,
	}: FetchCategoriesUseCaseRequest): Promise<FetchCategoriesUseCaseResponse> {
		const categories = await this.categoriesRepository.fetchAllByUserId(userId)

		return right({ data: categories })
	}
}
