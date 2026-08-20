import { makeTask } from 'test/unit/factories/make-tasks'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FetchTasksUseCase } from './fetch-tasks'

let tasksRepository: InMemoryTasksRepository

let sut: FetchTasksUseCase

describe('Fetch tasks [USE CASE]', () => {
	beforeEach(() => {
		tasksRepository = new InMemoryTasksRepository()

		sut = new FetchTasksUseCase(tasksRepository)
	})

	it('should be able to fetch user tasks filtered', async () => {
		for (let c = 0; c < 10; c++) {
			await tasksRepository.create(
				makeTask({
					userId: new UniqueEntityID('user-1'),
					priority: 'LOW',
					status: 'BACKLOG',
				}),
			)
		}

		for (let c = 0; c < 4; c++) {
			await tasksRepository.create(
				makeTask({
					userId: new UniqueEntityID('user-1'),
					priority: 'HIGH',
					status: 'DONE',
				}),
			)
		}

		for (let c = 0; c < 2; c++) {
			await tasksRepository.create(
				makeTask({
					userId: new UniqueEntityID('user-1'),
					title: 'Add auth middleware',
					priority: 'CRITICAL',
					status: 'IN_PROGRESS',
				}),
			)
		}

		const backlogTasks = await sut.execute({
			userId: 'user-1',
			filters: {
				status: ['BACKLOG'],
			},
		})

		const highPriorityTasks = await sut.execute({
			userId: 'user-1',
			filters: {
				priority: ['HIGH'],
			},
		})

		const bySearchTasks = await sut.execute({
			userId: 'user-1',
			filters: {
				search: 'auth',
			},
		})

		expect(backlogTasks.value?.data).toHaveLength(10)
		expect(highPriorityTasks.value?.data).toHaveLength(4)
		expect(bySearchTasks.value?.data.length).toBeGreaterThanOrEqual(1)
	})

	it('should be able to fetch user tasks sorted', async () => {
		for (let c = 0; c < 3; c++) {
			await tasksRepository.create(
				makeTask({
					userId: new UniqueEntityID('user-1'),
					priority: 'LOW',
					status: 'BACKLOG',
					updatedAt: new Date(2026, 0, 12, 10),
				}),
			)
		}

		for (let c = 0; c < 4; c++) {
			await tasksRepository.create(
				makeTask({
					userId: new UniqueEntityID('user-1'),
					priority: 'HIGH',
					status: 'DONE',
					updatedAt: new Date(2026, 0, 12, 14),
				}),
			)
		}

		for (let c = 0; c < 5; c++) {
			await tasksRepository.create(
				makeTask({
					userId: new UniqueEntityID('user-1'),
					priority: 'CRITICAL',
					status: 'IN_PROGRESS',
					updatedAt: new Date(2026, 0, 12, 18),
				}),
			)
		}

		const sortedByStatus = await sut.execute({
			userId: 'user-1',
			sort: {
				by: 'status',
				dir: 'desc',
			},
		})

		const sortedByPriority = await sut.execute({
			userId: 'user-1',
			sort: {
				by: 'priority',
				dir: 'asc',
			},
		})

		const sortedByUpdatedAt = await sut.execute({
			userId: 'user-1',
			sort: {
				by: 'updatedAt',
				dir: 'desc',
			},
		})

		expect(sortedByStatus.value?.data[0].status).toBe('DONE')
		expect(sortedByStatus.value?.data[11].status).toBe('BACKLOG')

		expect(sortedByPriority.value?.data[0].priority).toBe('LOW')
		expect(sortedByPriority.value?.data[11].priority).toBe('CRITICAL')

		expect(sortedByUpdatedAt.value?.data[0].updatedAt).toEqual(new Date(2026, 0, 12, 18))
		expect(sortedByUpdatedAt.value?.data[11].updatedAt).toEqual(new Date(2026, 0, 12, 10))
	})

	it('should be able to fetch user tasks paginated', async () => {
		for (let c = 0; c < 16; c++) {
			await tasksRepository.create(
				makeTask({
					userId: new UniqueEntityID('user-1'),
				}),
			)
		}

		const page1 = await sut.execute({
			userId: 'user-1',
			pagination: {
				page: 1,
				limit: 10,
			},
		})

		const page2 = await sut.execute({
			userId: 'user-1',
			pagination: {
				page: 2,
				limit: 10,
			},
		})

		expect(page1.value?.data).toHaveLength(10)
		expect(page2.value?.data).toHaveLength(6)

		expect(page1.value?.meta).toMatchObject({
			page: 1,
			limit: 10,
			total: 16,
		})
	})
})
