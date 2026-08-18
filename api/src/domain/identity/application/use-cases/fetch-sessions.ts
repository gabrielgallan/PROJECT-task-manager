import { Injectable } from '@nestjs/common'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { Either, left, right } from '@/core/types/either'
import { Session } from '../../enterprise/entities/session'
import { SessionsRepository } from '../repositories/sessions-repository'
import { UsersRepository } from '../repositories/users-repository'

type FetchSessionsUseCaseRequest = {
	userId: string
}

type FetchSessionsUseCaseResponse = Either<ResourceNotFoundError, { sessions: Session[] }>

@Injectable()
export class FetchSessionsUseCase {
	constructor(
		private sessionsRepository: SessionsRepository,
		private usersRepository: UsersRepository,
	) {}

	async execute({ userId }: FetchSessionsUseCaseRequest): Promise<FetchSessionsUseCaseResponse> {
		const user = await this.usersRepository.findById(userId)

		if (!user) {
			return left(new ResourceNotFoundError())
		}

		const sessions = await this.sessionsRepository.fetchByUserId(userId)

		return right({
			sessions,
		})
	}
}
