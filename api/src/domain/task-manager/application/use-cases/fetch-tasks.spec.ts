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

	it('should normalize title and description searches', async () => {
		await tasksRepository.create(
			makeTask({
				userId: new UniqueEntityID('user-1'),
				title: 'Revisar autenticação',
				description: 'Validar integração com o FRONTEND',
			}),
		)
		await tasksRepository.create(
			makeTask({
				userId: new UniqueEntityID('user-1'),
				title: 'Outra tarefa',
				description: 'Sem correspondência',
			}),
		)

		const byTitle = await sut.execute({
			userId: 'user-1',
			filters: { search: '  AUTENTICACAO  ' },
		})
		const byDescription = await sut.execute({
			userId: 'user-1',
			filters: { search: 'frontend' },
		})

		expect(byTitle.value?.data).toHaveLength(1)
		expect(byDescription.value?.data).toHaveLength(1)
		expect(byDescription.value?.data[0].title).toBe('Revisar autenticação')
	})

	it('should keep tasks without a due date last in both directions', async () => {
		await tasksRepository.create(
			makeTask({
				userId: new UniqueEntityID('user-1'),
				title: 'No due date',
				dueDate: null,
			}),
		)
		await tasksRepository.create(
			makeTask({
				userId: new UniqueEntityID('user-1'),
				title: 'Earlier',
				dueDate: new Date('2026-01-10T00:00:00.000Z'),
			}),
		)
		await tasksRepository.create(
			makeTask({
				userId: new UniqueEntityID('user-1'),
				title: 'Later',
				dueDate: new Date('2026-01-20T00:00:00.000Z'),
			}),
		)

		const ascending = await sut.execute({
			userId: 'user-1',
			sort: { by: 'dueDate', dir: 'asc' },
		})
		const descending = await sut.execute({
			userId: 'user-1',
			sort: { by: 'dueDate', dir: 'desc' },
		})

		expect(ascending.value?.data.map((task) => task.title)).toEqual([
			'Earlier',
			'Later',
			'No due date',
		])
		expect(descending.value?.data.map((task) => task.title)).toEqual([
			'Later',
			'Earlier',
			'No due date',
		])
	})

	it('should sort titles accent-insensitively and break other ties by title ascending', async () => {
		for (const title of ['zebra', 'Ábaco', 'banana']) {
			await tasksRepository.create(
				makeTask({
					userId: new UniqueEntityID('user-1'),
					title,
					status: 'BACKLOG',
				}),
			)
		}

		const byTitle = await sut.execute({
			userId: 'user-1',
			sort: { by: 'title', dir: 'asc' },
		})
		const byStatusDescending = await sut.execute({
			userId: 'user-1',
			sort: { by: 'status', dir: 'desc' },
		})

		const expectedOrder = ['Ábaco', 'banana', 'zebra']

		expect(byTitle.value?.data.map((task) => task.title)).toEqual(expectedOrder)
		expect(byStatusDescending.value?.data.map((task) => task.title)).toEqual(expectedOrder)
	})
})
