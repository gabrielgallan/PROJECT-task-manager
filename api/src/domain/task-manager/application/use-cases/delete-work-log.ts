import { Injectable } from '@nestjs/common'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { WorkLogsRepository } from '../repositories/work-logs-repository'

type DeleteWorkLogUseCaseRequest = {
	userId: string
	workLogId: string
}

type DeleteWorkLogUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>

@Injectable()
export class DeleteWorkLogUseCase {
	constructor(private worklogsRepository: WorkLogsRepository) {}

	async execute({
		userId,
		workLogId,
	}: DeleteWorkLogUseCaseRequest): Promise<DeleteWorkLogUseCaseResponse> {
		const workLog = await this.worklogsRepository.findById(workLogId)

		if (!workLog) {
			return left(new ResourceNotFoundError())
		}

		if (workLog.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		await this.worklogsRepository.delete(workLog)

		return right(null)
	}
}
