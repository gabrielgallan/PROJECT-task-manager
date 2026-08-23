import { makeCategory } from 'test/unit/factories/make-category'
import { makePlan } from 'test/unit/factories/make-plan'
import { makeTask } from 'test/unit/factories/make-tasks'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditPlanUseCase } from './edit-plan'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

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

	it('should reject a missing or another user plan', async () => {
		const missing = await sut.execute({ userId: 'user-1', planId: 'plan-1' })

		await plansRepository.create(
			makePlan(
				{ userId: new UniqueEntityID('user-2') },
				new UniqueEntityID('plan-1'),
			),
		)

		const anotherUser = await sut.execute({ userId: 'user-1', planId: 'plan-1' })

		expect(missing.value).toBeInstanceOf(ResourceNotFoundError)
		expect(anotherUser.value).toBeInstanceOf(NotAllowedError)
	})

	it('should validate referenced task and category ownership', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		const missingTask = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			taskId: 'task-1',
		})

		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-2') },
				new UniqueEntityID('task-1'),
			),
		)

		const anotherUserTask = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			taskId: 'task-1',
		})
		const missingCategory = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			categoryId: 'category-1',
		})

		await categoriesRepository.create(
			makeCategory(
				{ userId: new UniqueEntityID('user-2') },
				new UniqueEntityID('category-1'),
			),
		)

		const anotherUserCategory = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			categoryId: 'category-1',
		})

		expect(missingTask.value).toBeInstanceOf(ResourceNotFoundError)
		expect(anotherUserTask.value).toBeInstanceOf(NotAllowedError)
		expect(missingCategory.value).toBeInstanceOf(ResourceNotFoundError)
		expect(anotherUserCategory.value).toBeInstanceOf(NotAllowedError)
	})

	it('should reject an invalid interval', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			startsAt: new Date('2026-01-12T11:00:00.000Z'),
		})

		expect(result.value).toBeInstanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('endsAt must be after startsAt')
	})

	it('should assign and clear optional relations', async () => {
		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-1') },
				new UniqueEntityID('task-1'),
			),
		)
		await categoriesRepository.create(
			makeCategory(
				{ userId: new UniqueEntityID('user-1') },
				new UniqueEntityID('category-1'),
			),
		)
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			taskId: 'task-1',
			categoryId: 'category-1',
		})

		expect(plansRepository.items[0].taskId?.toString()).toBe('task-1')
		expect(plansRepository.items[0].categoryId?.toString()).toBe('category-1')

		await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			taskId: null,
			categoryId: null,
		})

		expect(plansRepository.items[0].taskId).toBeNull()
		expect(plansRepository.items[0].categoryId).toBeNull()
	})

	it('should preserve optional fields when they are omitted', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					title: 'Original title',
					description: 'Original description',
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		const result = await sut.execute({ userId: 'user-1', planId: 'plan-1' })

		expect(result.isRight()).toBe(true)
		expect(plansRepository.items[0].taskId).toBeNull()
		expect(plansRepository.items[0].categoryId).toBeNull()
		expect(plansRepository.items[0].title).toBe('Original title')
		expect(plansRepository.items[0].description).toBe('Original description')
	})
})
