import { makeCategory } from 'test/unit/factories/make-category'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditCategoryUseCase } from './edit-category'

let categoriesRepository: InMemoryCategoriesRepository

let sut: EditCategoryUseCase

describe('Edit category [USE CASE]', () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository()

		sut = new EditCategoryUseCase(categoriesRepository)
	})

	it('should be able to edit a category', async () => {
		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
					name: 'Job Events',
					color: 'red',
				},
				new UniqueEntityID('category-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
			name: 'Study',
			color: 'cyan',
		})

		expect(categoriesRepository.items[0].name).toBe('Study')
		expect(categoriesRepository.items[0].color).toBe('cyan')
	})

	it('should not be able to edit a category of another user', async () => {
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
			name: 'Study',
			color: 'cyan',
		})

		expect(result.value).instanceOf(NotAllowedError)
	})

	it('should not be able to edit a non-existent category', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
			name: 'Study',
			color: 'cyan',
		})

		expect(result.value).instanceOf(ResourceNotFoundError)
	})
})
