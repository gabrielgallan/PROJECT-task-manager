import { makeCategory } from 'test/unit/factories/make-category'
import { makeTask } from 'test/unit/factories/make-tasks'
import { makeWorkLog } from 'test/unit/factories/make-work-logs'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EditWorkLogUseCase } from './edit-work-log'

let workLogsRepository: InMemoryWorkLogsRepository
let tasksRepository: InMemoryTasksRepository
let categoriesRepository: InMemoryCategoriesRepository

let sut: EditWorkLogUseCase

describe('Edit work-log [USE CASE]', () => {
	beforeEach(() => {
		workLogsRepository = new InMemoryWorkLogsRepository()
		tasksRepository = new InMemoryTasksRepository()
		categoriesRepository = new InMemoryCategoriesRepository(
			new InMemoryPlansRepository(),
			new InMemoryWorkLogsRepository(),
		)

		sut = new EditWorkLogUseCase(workLogsRepository, tasksRepository, categoriesRepository)
	})

	it('should be able to edit a work-log', async () => {
		await tasksRepository.create(
			makeTask(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('task-1'),
			),
		)

		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('category-1'),
			),
		)

		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-1'),
					categoryId: new UniqueEntityID('category-1'),
					title: 'Team morning meet',
					description: null,
					startsAt: new Date(2026, 0, 12, 10, 0, 0),
					endsAt: new Date(2026, 0, 12, 12, 0, 0),
				},
				new UniqueEntityID('work-log-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			categoryId: null,
			taskId: 'task-1',
			title: 'HOTFIX: Fix JWT feature',
			description: 'Teams morning meet (CANCELED)',
			startsAt: new Date(2026, 0, 12, 9, 30, 0),
		})

		expect(workLogsRepository.items[0].categoryId).toBeNull()
		expect(workLogsRepository.items[0].taskId?.toString()).toBe('task-1')
		expect(workLogsRepository.items[0].title).toBe('HOTFIX: Fix JWT feature')
		expect(workLogsRepository.items[0].description).toBe('Teams morning meet (CANCELED)')
		expect(workLogsRepository.items[0].startsAt).toEqual(new Date(2026, 0, 12, 9, 30, 0))
		expect(workLogsRepository.items[0].endsAt).toEqual(new Date(2026, 0, 12, 12, 0, 0))
	})
})
