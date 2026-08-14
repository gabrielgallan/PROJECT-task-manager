import { Injectable } from '@nestjs/common'
import { addDays } from 'date-fns'
import { Either, left, right } from '@/core/types/either'
import { Account, AccountProvider } from '../../enterprise/entities/account'
import { Session } from '../../enterprise/entities/session'
import { User } from '../../enterprise/entities/user'
import { AuthProviderRegistry } from '../auth/auth-provider-registry'
import { SessionTokenGenerator } from '../cryptography/session-token-generator'
import { SessionTokenHasher } from '../cryptography/session-token-hasher'
import { AccountsRepository } from '../repositories/accounts-repository'
import { SessionsRepository } from '../repositories/sessions-repository'
import { UsersRepository } from '../repositories/users-repository'
import { UnsupportedAuthProviderError } from './errors/unsupported-auth-provider-error'

const supportedAccountProviders: AccountProvider[] = ['GITHUB', 'GOOGLE']

type AuthenticateWithProviderUseCaseRequest = {
	provider: AccountProvider
	code: string
	ipAddress?: string
	userAgent?: string
}

type AuthenticateWithProviderUseCaseResponse = Either<UnsupportedAuthProviderError, { token: string }>

@Injectable()
export class AuthenticateWithProviderUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private accountRepository: AccountsRepository,
		private sessionsRepository: SessionsRepository,
		private authProviders: AuthProviderRegistry,
		private sessionTokenGenerator: SessionTokenGenerator,
		private sessionsTokenHasher: SessionTokenHasher,
	) {}

	async execute({
		provider,
		code,
		ipAddress,
		userAgent,
	}: AuthenticateWithProviderUseCaseRequest): Promise<AuthenticateWithProviderUseCaseResponse> {
		if (!supportedAccountProviders.includes(provider)) {
			return left(new UnsupportedAuthProviderError(provider))
		}

		const { id, email, name, avatarUrl } = await this.authProviders.get(provider).signIn({
			code,
		})

		let user = await this.usersRepository.findByEmail(email)

		if (!user) {
			user = User.create({
				name,
				email,
				avatarUrl,
			})

			await this.usersRepository.create(user)
		}

		const account = await this.accountRepository.findByProviderAndUserId(
			provider,
			user.id.toString(),
		)

		if (!account) {
			const newAccount = Account.create({
				userId: user.id,
				provider,
				providerUserId: id,
			})

			await this.accountRepository.create(newAccount)
		}

		const token = this.sessionTokenGenerator.generate()

		const tokenHash = this.sessionsTokenHasher.hash(token)

		const session = Session.create({
			userId: user.id,
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
