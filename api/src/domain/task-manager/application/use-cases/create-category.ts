import { Injectable } from '@nestjs/common'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { type Either, right } from '@/core/types/either'
import { Category } from '../../enterprise/entities/category'
import { CategoriesRepository } from '../repositories/categories-repository'

type CreateCategoryUseCaseRequest = {
	userId: string
	name: string
	color: string
}

type CreateCategoryUseCaseResponse = Either<null, { category: Category }>

@Injectable()
export class CreateCategoryUseCase {
	constructor(private categoriesRepository: CategoriesRepository) {}

	async execute({
		userId,
		name,
		color,
	}: CreateCategoryUseCaseRequest): Promise<CreateCategoryUseCaseResponse> {
		const category = Category.create({
			userId: new UniqueEntityID(userId),
			name,
			color,
		})

		await this.categoriesRepository.create(category)

		return right({ category })
	}
}
