import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { PlansRepository } from '../repositories/plans-repository'

type DeletePlanUseCaseRequest = {
	userId: string
	planId: string
}

type DeletePlanUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>

@Injectable()
export class DeletePlanUseCase {
	constructor(private plansRepository: PlansRepository) {}

	async execute({ userId, planId }: DeletePlanUseCaseRequest): Promise<DeletePlanUseCaseResponse> {
		const plan = await this.plansRepository.findById(planId)

		if (!plan) {
			return left(new ResourceNotFoundError())
		}

		if (plan.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		await this.plansRepository.delete(plan)

		return right(null)
	}
}
