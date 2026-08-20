import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { CreateTaskUseCase } from './create-task'

let tasksRepository: InMemoryTasksRepository

let sut: CreateTaskUseCase

describe('Create task [USE CASE]', () => {
	beforeEach(() => {
		tasksRepository = new InMemoryTasksRepository()

		sut = new CreateTaskUseCase(tasksRepository)
	})

	it('should be able to create a task', async () => {
		await sut.execute({
			userId: 'user-1',
			title: 'Add e2e tests',
			description: 'Implement end-to-end controllers tests',
			priority: 'MEDIUM',
			dueDate: new Date(2026, 0, 12),
		})

		expect(tasksRepository.items).toHaveLength(1)
		expect(tasksRepository.items[0].title).toBe('Add e2e tests')
		expect(tasksRepository.items[0].description).toBe('Implement end-to-end controllers tests')
		expect(tasksRepository.items[0].priority).toBe('MEDIUM')
		expect(tasksRepository.items[0].status).toBe('BACKLOG')
		expect(tasksRepository.items[0].startDate).toBe(null)
		expect(tasksRepository.items[0].dueDate).toEqual(new Date(2026, 0, 12))
		expect(tasksRepository.items[0].createdAt).toEqual(expect.any(Date))
	})
})
