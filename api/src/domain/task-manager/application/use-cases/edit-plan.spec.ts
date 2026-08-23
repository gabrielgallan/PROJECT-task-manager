import { makeCategory } from 'test/unit/factories/make-category'
import { makePlan } from 'test/unit/factories/make-plan'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EditPlanUseCase } from './edit-plan'

let plansRepository: InMemoryPlansRepository
let tasksRepository: InMemoryTasksRepository
let categoriesRepository: InMemoryCategoriesRepository

let sut: EditPlanUseCase

describe('Edit plan [USE CASE]', () => {
	beforeEach(() => {
		plansRepository = new InMemoryPlansRepository()
		tasksRepository = new InMemoryTasksRepository()
		categoriesRepository = new InMemoryCategoriesRepository(
			plansRepository,
			new InMemoryWorkLogsRepository(),
		)

		sut = new EditPlanUseCase(plansRepository, tasksRepository, categoriesRepository)
	})

	it('should be able to edit a plan', async () => {
		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('category-1'),
			),
		)

		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					description: 'Fix something in app',
					startsAt: new Date(2026, 0, 12, 10, 0, 0),
					endsAt: new Date(2026, 0, 12, 11, 0, 0),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			categoryId: 'category-1',
			title: 'Fix JWT feature',
			description: null,
			startsAt: new Date(2026, 0, 12, 9, 0, 0),
		})

		expect(plansRepository.items[0].categoryId?.toString()).toBe('category-1')
		expect(plansRepository.items[0].title).toBe('Fix JWT feature')
		expect(plansRepository.items[0].description).toBeNull()
		expect(plansRepository.items[0].startsAt).toEqual(new Date(2026, 0, 12, 9, 0, 0))
		expect(plansRepository.items[0].endsAt).toEqual(new Date(2026, 0, 12, 11, 0, 0))
		expect(plansRepository.items[0].updatedAt).toEqual(expect.any(Date))
	})
})
