import { Injectable } from '@nestjs/common'
import { addDays } from 'date-fns'
import { Either, left, right } from '@/core/types/either'
import { Session } from '../../enterprise/entities/session'
import { Hasher } from '../cryptography/hasher'
import { SessionTokenGenerator } from '../cryptography/session-token-generator'
import { SessionTokenHasher } from '../cryptography/session-token-hasher'
import { SessionsRepository } from '../repositories/sessions-repository'
import { UsersRepository } from '../repositories/users-repository'
import { InvalidCredentialsError } from './errors/invalid-credentials-error'

type AuthenticateUseCaseRequest = {
	email: string
	password: string
	ipAddress?: string
	userAgent?: string
}

type AuthenticateUseCaseResponse = Either<InvalidCredentialsError, { token: string }>

@Injectable()
export class AuthenticateUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private sessionsRepository: SessionsRepository,
		private hasher: Hasher,
		private sessionTokenGenerator: SessionTokenGenerator,
		private sessionTokenHasher: SessionTokenHasher,
	) {}

	async execute({
		email,
		password,
		ipAddress,
		userAgent,
	}: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse> {
		const userFromEmail = await this.usersRepository.findByEmail(email)

		if (!userFromEmail?.passwordHash) {
			return left(new InvalidCredentialsError())
		}

		const isPasswordCorrect = await this.hasher.compare(password, userFromEmail.passwordHash)

		if (!isPasswordCorrect) {
			return left(new InvalidCredentialsError())
		}

		const token = this.sessionTokenGenerator.generate()

		const tokenHash = this.sessionTokenHasher.hash(token)

		const session = Session.create({
			userId: userFromEmail.id,
			tokenHash,
			expiresAt: addDays(new Date(), 30),
			ipAddress,
			userAgent,
		})

		await this.sessionsRepository.create(session)

		return right({
			token,
		})
	}
}
