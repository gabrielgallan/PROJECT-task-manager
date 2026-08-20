import { makeTask } from 'test/unit/factories/make-tasks'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { DeleteTaskUseCase } from './delete-task'

let tasksRepository: InMemoryTasksRepository

let sut: DeleteTaskUseCase

describe('Delete task [USE CASE]', () => {
	beforeEach(() => {
		tasksRepository = new InMemoryTasksRepository()

		sut = new DeleteTaskUseCase(tasksRepository)
	})

	it('should be able to delete a task', async () => {
		await tasksRepository.create(
			makeTask(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('task-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			taskId: 'task-1',
		})

		expect(tasksRepository.items).toHaveLength(0)
	})

	it('should not be able to delete a nonexistent task', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			taskId: 'non-existing-task',
		})

		expect(result.isLeft()).toBe(true)
		expect(result.value).instanceOf(ResourceNotFoundError)
	})

	it('should be able to delete a task of another user', async () => {
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
