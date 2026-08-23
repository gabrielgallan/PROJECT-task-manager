import { makeCategory } from 'test/unit/factories/make-category'
import { makeTask } from 'test/unit/factories/make-tasks'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { CreatePlanUseCase } from './create-plan'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

let plansRepository: InMemoryPlansRepository
let tasksRepository: InMemoryTasksRepository
let categoriesRepository: InMemoryCategoriesRepository

let sut: CreatePlanUseCase

describe('Create plan [USE CASE]', () => {
	beforeEach(() => {
		plansRepository = new InMemoryPlansRepository()
		tasksRepository = new InMemoryTasksRepository()
		categoriesRepository = new InMemoryCategoriesRepository(
			plansRepository,
			new InMemoryWorkLogsRepository(),
		)

		sut = new CreatePlanUseCase(plansRepository, tasksRepository, categoriesRepository)
	})

	it('should be able to create a plan', async () => {
		await sut.execute({
			userId: 'user-1',
			title: 'Team meet',
			startsAt: new Date(2026, 0, 12, 10),
			endsAt: new Date(2026, 0, 12, 11),
		})

		expect(plansRepository.items).toHaveLength(1)
		expect(plansRepository.items[0].taskId).toBeNull()
		expect(plansRepository.items[0].categoryId).toBeNull()
		expect(plansRepository.items[0].title).toBe('Team meet')
		expect(plansRepository.items[0].description).toBeNull()
		expect(plansRepository.items[0].startsAt).toEqual(new Date(2026, 0, 12, 10))
		expect(plansRepository.items[0].endsAt).toEqual(new Date(2026, 0, 12, 11))
		expect(plansRepository.items[0].confirmedAt).toBeNull()
		expect(plansRepository.items[0].createdAt).toEqual(expect.any(Date))
		expect(plansRepository.items[0].updatedAt).toBeNull()
	})

	it('should not be able to create a plan with endsAt before startsAt', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			title: 'Team meet',
			startsAt: new Date(2026, 0, 12, 12),
			endsAt: new Date(2026, 0, 12, 10),
		})

		expect(result.value).instanceOf(InvalidDatetimeError)
	})

	it('should not be able to create a plan to a non-existent or of another user task', async () => {
		await tasksRepository.create(
			makeTask(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('task-1'),
			),
		)

		const result1 = await sut.execute({
			userId: 'user-2',
			taskId: 'task-1',
			title: 'Team meet',
			startsAt: new Date(2026, 0, 12, 10),
			endsAt: new Date(2026, 0, 12, 11),
		})

		const result2 = await sut.execute({
			userId: 'user-2',
			taskId: 'non-existent-task',
			title: 'Team meet',
			startsAt: new Date(2026, 0, 12, 10),
			endsAt: new Date(2026, 0, 12, 11),
		})

		expect(result1.value).instanceOf(NotAllowedError)
		expect(result2.value).instanceOf(ResourceNotFoundError)
	})

	it('should not be able to create a plan to a non-existent or of another user category', async () => {
		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('category-1'),
			),
		)

		const result1 = await sut.execute({
			userId: 'user-2',
			categoryId: 'category-1',
			title: 'Team meet',
			startsAt: new Date(2026, 0, 12, 10),
			endsAt: new Date(2026, 0, 12, 11),
		})

		const result2 = await sut.execute({
			userId: 'user-2',
			categoryId: 'non-existent-category',
			title: 'Team meet',
			startsAt: new Date(2026, 0, 12, 10),
			endsAt: new Date(2026, 0, 12, 11),
		})

		expect(result1.value).instanceOf(NotAllowedError)
		expect(result2.value).instanceOf(ResourceNotFoundError)
	})
})
