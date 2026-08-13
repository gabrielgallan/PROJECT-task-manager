import { addDays } from 'date-fns'
import { Account, AccountProvider } from '../../enterprise/entities/account'
import { Session } from '../../enterprise/entities/session'
import { User } from '../../enterprise/entities/user'
import type { AuthProvider } from '../auth/auth-provider'
import { SessionTokenGenerator } from '../cryptography/session-token-generator'
import { SessionTokenHasher } from '../cryptography/session-token-hasher'
import { AccountsRepository } from '../repositories/accounts-repository'
import { SessionsRepository } from '../repositories/sessions-repository'
import type { UsersRepository } from '../repositories/users-repository'

type AuthenticateWithProviderUseCaseRequest = {
	provider: AccountProvider
	code: string
	ipAddress?: string
	userAgent?: string
}

type AuthenticateWithProviderUseCaseResponse = { token: string }

export class AuthenticateWithProviderUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private accountRepository: AccountsRepository,
		private sessionsRepository: SessionsRepository,
		private authProvider: AuthProvider,
		private sessionTokenGenerator: SessionTokenGenerator,
		private sessionsTokenHasher: SessionTokenHasher,
	) {}

	async execute({
		provider,
		code,
		ipAddress,
		userAgent,
	}: AuthenticateWithProviderUseCaseRequest): Promise<AuthenticateWithProviderUseCaseResponse> {
		const { id, email, name, avatarUrl } = await this.authProvider.signIn({
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

		return {
			token,
		}
	}
}
