import { Injectable } from '@nestjs/common'
import { isBefore } from 'date-fns'
import { type Either, left, right } from '@/core/types/either'
import type { PlanData } from '../../enterprise/entities/value-objects/plan-data'
import { PlanFilterInput, PlansRepository } from '../repositories/plans-repository'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

type FetchPlansUseCaseRequest = {
	userId: string
	from: Date
	to: Date
	filters?: PlanFilterInput
}

type FetchPlansUseCaseResponse = Either<
	InvalidDatetimeError,
	{
		data: PlanData[]
	}
>

@Injectable()
export class FetchPlansUseCase {
	constructor(private plansRepository: PlansRepository) {}

	async execute({
		userId,
		from,
		to,
		filters,
	}: FetchPlansUseCaseRequest): Promise<FetchPlansUseCaseResponse> {
		if (!isBefore(from, to)) {
			return left(new InvalidDatetimeError('to must be after from'))
		}

		const data = await this.plansRepository.fetchAllWithDataByUserId(userId, { from, to }, filters)

		return right({ data })
	}
}
