import { Injectable } from '@nestjs/common'
import { isBefore } from 'date-fns'
import { type Either, left, right } from '@/core/types/either'
import type { WorkLogData } from '../../enterprise/entities/value-objects/work-log-data'
import { WorkLogFilterInput, WorkLogsRepository } from '../repositories/work-logs-repository'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

type FetchWorkLogsUseCaseRequest = {
	userId: string
	from: Date
	to: Date
	filters?: WorkLogFilterInput
}

type FetchWorkLogsUseCaseResponse = Either<
	InvalidDatetimeError,
	{
		data: WorkLogData[]
	}
>

@Injectable()
export class FetchWorkLogsUseCase {
	constructor(private workLogsRepository: WorkLogsRepository) {}

	async execute({
		userId,
		from,
		to,
		filters,
	}: FetchWorkLogsUseCaseRequest): Promise<FetchWorkLogsUseCaseResponse> {
		if (!isBefore(from, to)) {
			return left(new InvalidDatetimeError('to must be after from'))
		}

		const data = await this.workLogsRepository.fetchAllWithDataByUserId(
			userId,
			{ from, to },
			filters,
		)

		return right({ data })
	}
}
