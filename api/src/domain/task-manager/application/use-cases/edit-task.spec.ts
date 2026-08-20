import { makeTask } from 'test/unit/factories/make-tasks'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditTaskUseCase } from './edit-task'

let tasksRepository: InMemoryTasksRepository

let sut: EditTaskUseCase

describe('Edit task [USE CASE]', () => {
	beforeEach(() => {
		tasksRepository = new InMemoryTasksRepository()

		sut = new EditTaskUseCase(tasksRepository)
	})

	it('should be able to edit a task', async () => {
		await tasksRepository.create(
			makeTask(
				{
					userId: new UniqueEntityID('user-1'),
					title: 'Fix something',
					priority: 'LOW',
				},
				new UniqueEntityID('task-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			taskId: 'task-1',
			title: 'fix (auth): fix auth middleware',
			description: 'Fix auth guard of nestjs framework',
			priority: 'MEDIUM',
			status: 'IN_PROGRESS',
			startDate: new Date(2026, 0, 10),
			dueDate: new Date(2026, 0, 12),
		})

		expect(tasksRepository.items[0].title).toBe('fix (auth): fix auth middleware')
		expect(tasksRepository.items[0].description).toBe('Fix auth guard of nestjs framework')
		expect(tasksRepository.items[0].priority).toBe('MEDIUM')
		expect(tasksRepository.items[0].status).toBe('IN_PROGRESS')
		expect(tasksRepository.items[0].startDate).toEqual(new Date(2026, 0, 10))
		expect(tasksRepository.items[0].dueDate).toEqual(new Date(2026, 0, 12))
	})

	it('should not be able to edit a nonexistent task', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			taskId: 'non-existing-task',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).instanceOf(ResourceNotFoundError)
	})

	it('should be able to edit a task of another user', async () => {
		await tasksRepository.create(
			makeTask(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('task-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-2',
			taskId: 'task-1',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).instanceOf(NotAllowedError)
	})
})
