import { makeCategory } from 'test/unit/factories/make-category'
import { makePlan } from 'test/unit/factories/make-plan'
import { makeWorkLog } from 'test/unit/factories/make-work-logs'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { GetCategoryDeletionImpactUseCase } from './get-category-deletion-impact'

let categoriesRepository: InMemoryCategoriesRepository

let plansRepository: InMemoryPlansRepository
let workLogsRepository: InMemoryWorkLogsRepository

let sut: GetCategoryDeletionImpactUseCase

describe('Get category deletion impact [USE CASE]', () => {
	beforeEach(() => {
		plansRepository = new InMemoryPlansRepository()
		workLogsRepository = new InMemoryWorkLogsRepository()
		categoriesRepository = new InMemoryCategoriesRepository(plansRepository, workLogsRepository)

		sut = new GetCategoryDeletionImpactUseCase(categoriesRepository)
	})

	it('should be able to get category deletion impact', async () => {
		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('category-1'),
			),
		)

		for (let c = 0; c < 8; c++) {
			await plansRepository.create(
				makePlan({
					userId: new UniqueEntityID('user-1'),
					categoryId: new UniqueEntityID('category-1'),
				}),
			)
		}

		for (let c = 0; c < 4; c++) {
			await workLogsRepository.create(
				makeWorkLog({
					userId: new UniqueEntityID('user-1'),
					categoryId: new UniqueEntityID('category-1'),
				}),
			)
		}

		const result = await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
		})

		expect(result.value).toEqual({
			plansCount: 8,
			workLogsCount: 4,
		})
	})
})
