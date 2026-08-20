import { makeCategory } from 'test/unit/factories/make-category'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { DeleteCategoryUseCase } from './delete-category'

let categoriesRepository: InMemoryCategoriesRepository

let sut: DeleteCategoryUseCase

describe('Delete category [USE CASE]', () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository()

		sut = new DeleteCategoryUseCase(categoriesRepository)
	})

	it('should be able to delete a category', async () => {
		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('category-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
		})

		expect(categoriesRepository.items).toHaveLength(0)
	})

	it('should not be able to delete a category of another user', async () => {
		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('category-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-2',
			categoryId: 'category-1',
		})

		expect(result.value).instanceOf(NotAllowedError)
	})

	it('should not be able to delete a non-existent category', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
		})

		expect(result.value).instanceOf(ResourceNotFoundError)
	})
})
