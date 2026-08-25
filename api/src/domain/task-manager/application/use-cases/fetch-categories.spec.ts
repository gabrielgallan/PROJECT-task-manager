import { makeCategory } from 'test/unit/factories/make-category'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { makeInMemoryTaskManagerRepositories } from 'test/unit/repositories/make-in-memory-task-manager-repositories'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FetchCategoriesUseCase } from './fetch-categories'

let categoriesRepository: InMemoryCategoriesRepository

let sut: FetchCategoriesUseCase

describe('Fetch categories [USE CASE]', () => {
	beforeEach(() => {
		;({ categoriesRepository } = makeInMemoryTaskManagerRepositories())

		sut = new FetchCategoriesUseCase(categoriesRepository)
	})

	it('should be able to fetch user categories', async () => {
		for (let c = 0; c < 8; c++) {
			await categoriesRepository.create(
				makeCategory({
					userId: new UniqueEntityID('user-1'),
				}),
			)
		}

		for (let c = 0; c < 2; c++) {
			await categoriesRepository.create(makeCategory())
		}

		const result = await sut.execute({
			userId: 'user-1',
		})

		expect(result.value?.data).toHaveLength(8)
	})
})
