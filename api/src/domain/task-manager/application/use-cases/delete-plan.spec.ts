import { makePlan } from 'test/unit/factories/make-plan'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { DeletePlanUseCase } from './delete-plan'

let plansRepository: InMemoryPlansRepository

let sut: DeletePlanUseCase

describe('Delete category [USE CASE]', () => {
	beforeEach(() => {
		plansRepository = new InMemoryPlansRepository()

		sut = new DeletePlanUseCase(plansRepository)
	})

	it('should be able to delete a plan', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
		})

		expect(plansRepository.items).toHaveLength(0)
	})

	it('should not be able to delete a category of another plan', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-2',
			planId: 'plan-1',
		})

		expect(result.value).instanceOf(NotAllowedError)
	})

	it('should not be able to delete a non-existent plan', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
		})

		expect(result.value).instanceOf(ResourceNotFoundError)
	})
})
