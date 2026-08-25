import { makeWorkLog } from 'test/unit/factories/make-work-logs'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { makeInMemoryTaskManagerRepositories } from 'test/unit/repositories/make-in-memory-task-manager-repositories'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { DeleteWorkLogUseCase } from './delete-work-log'

let workLogsRepository: InMemoryWorkLogsRepository

let sut: DeleteWorkLogUseCase

describe('Delete work-log [USE CASE]', () => {
	beforeEach(() => {
		;({ workLogsRepository } = makeInMemoryTaskManagerRepositories())

		sut = new DeleteWorkLogUseCase(workLogsRepository)
	})

	it('should be able to delete a work-log', async () => {
		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('work-log-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
		})

		expect(workLogsRepository.items).toHaveLength(0)
	})

	it('should not be able to delete a work-log of another user', async () => {
		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('work-log-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-2',
			workLogId: 'work-log-1',
		})

		expect(result.value).instanceOf(NotAllowedError)
	})

	it('should not be able to delete a non-existentr work-log', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
		})

		expect(result.value).instanceOf(ResourceNotFoundError)
	})
})
