import { makeCategory } from 'test/unit/factories/make-category'
import { makeTask } from 'test/unit/factories/make-tasks'
import { makeWorkLog } from 'test/unit/factories/make-work-logs'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { makeInMemoryTaskManagerRepositories } from 'test/unit/repositories/make-in-memory-task-manager-repositories'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { WorkLogData } from '../../enterprise/entities/value-objects/work-log-data'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'
import { FetchWorkLogsUseCase } from './fetch-work-logs'

let workLogsRepository: InMemoryWorkLogsRepository
let tasksRepository: InMemoryTasksRepository
let categoriesRepository: InMemoryCategoriesRepository

let sut: FetchWorkLogsUseCase

const range = {
	from: new Date('2026-01-12T09:00:00.000Z'),
	to: new Date('2026-01-12T17:00:00.000Z'),
}

describe('Fetch work logs [USE CASE]', () => {
	beforeEach(() => {
		;({ workLogsRepository, tasksRepository, categoriesRepository } =
			makeInMemoryTaskManagerRepositories())

		sut = new FetchWorkLogsUseCase(workLogsRepository)
	})

	it('should fetch overlapping user work logs ordered by start time', async () => {
		const spanningRange = makeWorkLog(
			{
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-12T08:00:00.000Z'),
				endsAt: new Date('2026-01-12T18:00:00.000Z'),
			},
			new UniqueEntityID('spanning-range'),
		)
		const startingBeforeRange = makeWorkLog(
			{
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-12T08:30:00.000Z'),
				endsAt: new Date('2026-01-12T09:30:00.000Z'),
			},
			new UniqueEntityID('starting-before-range'),
		)
		const contained = makeWorkLog(
			{
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-12T10:00:00.000Z'),
				endsAt: new Date('2026-01-12T11:00:00.000Z'),
			},
			new UniqueEntityID('contained'),
		)
		const endingAfterRange = makeWorkLog(
			{
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-12T16:30:00.000Z'),
				endsAt: new Date('2026-01-12T18:00:00.000Z'),
			},
			new UniqueEntityID('ending-after-range'),
		)

		const excludedWorkLogs = [
			makeWorkLog({
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-12T08:00:00.000Z'),
				endsAt: range.from,
			}),
			makeWorkLog({
				userId: new UniqueEntityID('user-1'),
				startsAt: range.to,
				endsAt: new Date('2026-01-12T18:00:00.000Z'),
			}),
			makeWorkLog({
				userId: new UniqueEntityID('user-2'),
				startsAt: new Date('2026-01-12T12:00:00.000Z'),
				endsAt: new Date('2026-01-12T13:00:00.000Z'),
			}),
		]

		for (const workLog of [
			contained,
			endingAfterRange,
			startingBeforeRange,
			spanningRange,
			...excludedWorkLogs,
		]) {
			await workLogsRepository.create(workLog)
		}

		const result = await sut.execute({ userId: 'user-1', ...range })

		expect(result.isRight()).toBe(true)
		if (result.isLeft()) throw result.value
		expect(result.value?.data.map((workLog) => workLog.id)).toEqual([
			'spanning-range',
			'starting-before-range',
			'contained',
			'ending-after-range',
		])
	})

	it('should include owned task and category summaries without exposing missing relations', async () => {
		const task = makeTask(
			{ userId: new UniqueEntityID('user-1'), title: 'Review pull request' },
			new UniqueEntityID('task-1'),
		)
		const category = makeCategory(
			{ userId: new UniqueEntityID('user-1'), name: 'Development', color: 'blue' },
			new UniqueEntityID('category-1'),
		)
		const foreignTask = makeTask(
			{ userId: new UniqueEntityID('user-2') },
			new UniqueEntityID('foreign-task'),
		)
		const foreignCategory = makeCategory(
			{ userId: new UniqueEntityID('user-2') },
			new UniqueEntityID('foreign-category'),
		)
		const relatedWorkLog = makeWorkLog(
			{
				userId: new UniqueEntityID('user-1'),
				taskId: task.id,
				categoryId: category.id,
				title: 'Pull request review',
				description: 'Review the authentication changes',
				startsAt: new Date('2026-01-12T10:00:00.000Z'),
				endsAt: new Date('2026-01-12T11:00:00.000Z'),
				createdAt: new Date('2026-01-12T11:00:00.000Z'),
				updatedAt: null,
			},
			new UniqueEntityID('related-work-log'),
		)
		const workLogWithMissingRelations = makeWorkLog(
			{
				userId: new UniqueEntityID('user-1'),
				taskId: new UniqueEntityID('missing-task'),
				categoryId: new UniqueEntityID('missing-category'),
				startsAt: new Date('2026-01-12T12:00:00.000Z'),
				endsAt: new Date('2026-01-12T13:00:00.000Z'),
			},
			new UniqueEntityID('missing-relations-work-log'),
		)
		const workLogWithForeignRelations = makeWorkLog(
			{
				userId: new UniqueEntityID('user-1'),
				taskId: foreignTask.id,
				categoryId: foreignCategory.id,
				startsAt: new Date('2026-01-12T14:00:00.000Z'),
				endsAt: new Date('2026-01-12T15:00:00.000Z'),
			},
			new UniqueEntityID('foreign-relations-work-log'),
		)

		await tasksRepository.create(task)
		await tasksRepository.create(foreignTask)
		await categoriesRepository.create(category)
		await categoriesRepository.create(foreignCategory)
		await workLogsRepository.create(relatedWorkLog)
		await workLogsRepository.create(workLogWithMissingRelations)
		await workLogsRepository.create(workLogWithForeignRelations)

		const result = await sut.execute({ userId: 'user-1', ...range })

		if (result.isLeft()) throw result.value
		expect(result.value?.data[0]).toBeInstanceOf(WorkLogData)
		expect(result.value?.data[0]).toMatchObject({
			id: 'related-work-log',
			taskId: 'task-1',
			categoryId: 'category-1',
			title: 'Pull request review',
			description: 'Review the authentication changes',
			startsAt: new Date('2026-01-12T10:00:00.000Z'),
			endsAt: new Date('2026-01-12T11:00:00.000Z'),
			createdAt: new Date('2026-01-12T11:00:00.000Z'),
			updatedAt: null,
		})
		expect(result.value?.data[0].task).toEqual({ id: 'task-1', title: 'Review pull request' })
		expect(result.value?.data[0].category).toEqual({
			id: 'category-1',
			name: 'Development',
			color: 'blue',
		})
		expect(result.value?.data[1]).toMatchObject({
			taskId: 'missing-task',
			categoryId: 'missing-category',
		})
		expect(result.value?.data[1].task).toBeNull()
		expect(result.value?.data[1].category).toBeNull()
		expect(result.value?.data[2]).toMatchObject({
			taskId: 'foreign-task',
			categoryId: 'foreign-category',
		})
		expect(result.value?.data[2].task).toBeNull()
		expect(result.value?.data[2].category).toBeNull()
	})

	it('should apply OR within filter facets and AND between them', async () => {
		const workLogInputs = [
			['task-1', 'category-1'],
			['task-2', 'category-1'],
			[null, 'category-1'],
			['task-1', null],
			[null, null],
		] as const

		for (const [index, [taskId, categoryId]] of workLogInputs.entries()) {
			await workLogsRepository.create(
				makeWorkLog(
					{
						userId: new UniqueEntityID('user-1'),
						taskId: taskId ? new UniqueEntityID(taskId) : null,
						categoryId: categoryId ? new UniqueEntityID(categoryId) : null,
						startsAt: new Date(`2026-01-12T${10 + index}:00:00.000Z`),
						endsAt: new Date(`2026-01-12T${11 + index}:00:00.000Z`),
					},
					new UniqueEntityID(`work-log-${index + 1}`),
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

		if (byMultipleTasks.isLeft()) throw byMultipleTasks.value
		if (byTaskOrWithoutTaskAndCategory.isLeft()) {
			throw byTaskOrWithoutTaskAndCategory.value
		}
		if (withoutCategory.isLeft()) throw withoutCategory.value
		expect(byMultipleTasks.value?.data.map((workLog) => workLog.id)).toEqual([
			'work-log-1',
			'work-log-2',
			'work-log-4',
		])
		expect(byTaskOrWithoutTaskAndCategory.value?.data.map((workLog) => workLog.id)).toEqual([
			'work-log-1',
			'work-log-3',
		])
		expect(withoutCategory.value?.data.map((workLog) => workLog.id)).toEqual([
			'work-log-4',
			'work-log-5',
		])
	})

	it('should reject equal, inverted or invalid date ranges', async () => {
		const fetchWorkLogs = vi.spyOn(workLogsRepository, 'fetchAllWithDataByUserId')

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
		expect(fetchWorkLogs).not.toHaveBeenCalled()
	})
})
