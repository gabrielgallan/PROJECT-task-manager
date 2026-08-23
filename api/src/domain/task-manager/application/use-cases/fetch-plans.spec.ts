import { makeCategory } from 'test/unit/factories/make-category'
import { makePlan } from 'test/unit/factories/make-plan'
import { makeTask } from 'test/unit/factories/make-tasks'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'
import { FetchPlansUseCase } from './fetch-plans'

let plansRepository: InMemoryPlansRepository
let tasksRepository: InMemoryTasksRepository
let categoriesRepository: InMemoryCategoriesRepository

let sut: FetchPlansUseCase

const range = {
	from: new Date('2026-01-12T00:00:00.000Z'),
	to: new Date('2026-01-13T00:00:00.000Z'),
}

describe('Fetch plans [USE CASE]', () => {
	beforeEach(() => {
		plansRepository = new InMemoryPlansRepository()
		tasksRepository = new InMemoryTasksRepository()
		categoriesRepository = new InMemoryCategoriesRepository(
			plansRepository,
			new InMemoryWorkLogsRepository(),
		)

		sut = new FetchPlansUseCase(plansRepository, tasksRepository, categoriesRepository)
	})

	it('should fetch overlapping user plans ordered by start time', async () => {
		const spanningRange = makePlan(
			{
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-11T20:00:00.000Z'),
				endsAt: new Date('2026-01-13T04:00:00.000Z'),
			},
			new UniqueEntityID('spanning-range'),
		)
		const crossingMidnight = makePlan(
			{
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-11T23:30:00.000Z'),
				endsAt: new Date('2026-01-12T00:30:00.000Z'),
			},
			new UniqueEntityID('crossing-midnight'),
		)
		const contained = makePlan(
			{
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-12T10:00:00.000Z'),
				endsAt: new Date('2026-01-12T11:00:00.000Z'),
			},
			new UniqueEntityID('contained'),
		)
		const endingAfterRange = makePlan(
			{
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-12T23:30:00.000Z'),
				endsAt: new Date('2026-01-13T00:30:00.000Z'),
			},
			new UniqueEntityID('ending-after-range'),
		)

		const excludedPlans = [
			makePlan({
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-11T22:00:00.000Z'),
				endsAt: range.from,
			}),
			makePlan({
				userId: new UniqueEntityID('user-1'),
				startsAt: range.to,
				endsAt: new Date('2026-01-13T01:00:00.000Z'),
			}),
			makePlan({
				userId: new UniqueEntityID('user-2'),
				startsAt: new Date('2026-01-12T12:00:00.000Z'),
				endsAt: new Date('2026-01-12T13:00:00.000Z'),
			}),
		]

		for (const plan of [contained, endingAfterRange, crossingMidnight, spanningRange, ...excludedPlans]) {
			await plansRepository.create(plan)
		}

		const result = await sut.execute({ userId: 'user-1', ...range })

		expect(result.isRight()).toBe(true)
		expect(result.value?.data.map(({ plan }) => plan.id.toString())).toEqual([
			'spanning-range',
			'crossing-midnight',
			'contained',
			'ending-after-range',
		])
	})

	it('should include owned task and category summaries without exposing missing relations', async () => {
		const task = makeTask(
			{ userId: new UniqueEntityID('user-1'), title: 'Prepare release' },
			new UniqueEntityID('task-1'),
		)
		const category = makeCategory(
			{ userId: new UniqueEntityID('user-1'), name: 'Development', color: 'blue' },
			new UniqueEntityID('category-1'),
		)
		const relatedPlan = makePlan({
			userId: new UniqueEntityID('user-1'),
			taskId: task.id,
			categoryId: category.id,
			startsAt: new Date('2026-01-12T10:00:00.000Z'),
			endsAt: new Date('2026-01-12T11:00:00.000Z'),
		})
		const planWithMissingRelations = makePlan({
			userId: new UniqueEntityID('user-1'),
			taskId: new UniqueEntityID('missing-task'),
			categoryId: new UniqueEntityID('missing-category'),
			startsAt: new Date('2026-01-12T12:00:00.000Z'),
			endsAt: new Date('2026-01-12T13:00:00.000Z'),
		})

		await tasksRepository.create(task)
		await categoriesRepository.create(category)
		await plansRepository.create(relatedPlan)
		await plansRepository.create(planWithMissingRelations)

		const result = await sut.execute({ userId: 'user-1', ...range })

		expect(result.value?.data[0].task).toEqual({ id: task.id, title: 'Prepare release' })
		expect(result.value?.data[0].category).toEqual({
			id: category.id,
			name: 'Development',
			color: 'blue',
		})
		expect(result.value?.data[1].task).toBeNull()
		expect(result.value?.data[1].category).toBeNull()
	})

	it('should apply OR within filter facets and AND between them', async () => {
		const planInputs = [
			['task-1', 'category-1'],
			['task-2', 'category-1'],
			[null, 'category-1'],
			['task-1', null],
			[null, null],
		] as const

		for (const [index, [taskId, categoryId]] of planInputs.entries()) {
			await plansRepository.create(
				makePlan(
					{
						userId: new UniqueEntityID('user-1'),
						taskId: taskId ? new UniqueEntityID(taskId) : null,
						categoryId: categoryId ? new UniqueEntityID(categoryId) : null,
						startsAt: new Date(`2026-01-12T${10 + index}:00:00.000Z`),
						endsAt: new Date(`2026-01-12T${11 + index}:00:00.000Z`),
					},
					new UniqueEntityID(`plan-${index + 1}`),
				),
			)
		}

		const byMultipleTasks = await sut.execute({
			userId: 'user-1',
			...range,
			filters: { taskIds: ['task-1', 'task-2'] },
		})
		const byTaskOrWithoutTaskAndCategory = await sut.execute({
			userId: 'user-1',
			...range,
			filters: {
				taskIds: ['task-1'],
				withoutTask: true,
				categoryIds: ['category-1'],
			},
		})
		const withoutCategory = await sut.execute({
			userId: 'user-1',
			...range,
			filters: { withoutCategory: true },
		})

		expect(byMultipleTasks.value?.data.map(({ plan }) => plan.id.toString())).toEqual([
			'plan-1',
			'plan-2',
			'plan-4',
		])
		expect(
			byTaskOrWithoutTaskAndCategory.value?.data.map(({ plan }) => plan.id.toString()),
		).toEqual(['plan-1', 'plan-3'])
		expect(withoutCategory.value?.data.map(({ plan }) => plan.id.toString())).toEqual([
			'plan-4',
			'plan-5',
		])
	})

	it('should reject equal, inverted or invalid date ranges', async () => {
		const fetchPlans = vi.spyOn(plansRepository, 'fetchAllByUserId')

		const equalRange = await sut.execute({
			userId: 'user-1',
			from: range.from,
			to: range.from,
		})
		const invertedRange = await sut.execute({
			userId: 'user-1',
			from: range.to,
			to: range.from,
		})
		const invalidRange = await sut.execute({
			userId: 'user-1',
			from: new Date('invalid'),
			to: range.to,
		})

		expect(equalRange.value).toBeInstanceOf(InvalidDatetimeError)
		expect(invertedRange.value).toBeInstanceOf(InvalidDatetimeError)
		expect(invalidRange.value).toBeInstanceOf(InvalidDatetimeError)
		expect(fetchPlans).not.toHaveBeenCalled()
	})
})
