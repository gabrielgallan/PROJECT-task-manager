import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { CreateCategoryUseCase } from './create-category'

let categoriesRepository: InMemoryCategoriesRepository

let sut: CreateCategoryUseCase

describe('Create category [USE CASE]', () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository()

		sut = new CreateCategoryUseCase(categoriesRepository)
	})

	it('should be able to create a category', async () => {
		await sut.execute({
			userId: 'user-1',
			name: 'Study',
			color: 'blue',
		})

		expect(categoriesRepository.items).toHaveLength(1)
		expect(categoriesRepository.items[0].name).toBe('Study')
		expect(categoriesRepository.items[0].color).toBe('blue')
		expect(categoriesRepository.items[0].userId.toString()).toBe('user-1')
		expect(categoriesRepository.items[0].createdAt).toEqual(expect.any(Date))
		expect(categoriesRepository.items[0].updatedAt).toBe(null)
	})
})
