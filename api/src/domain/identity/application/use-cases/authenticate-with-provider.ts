import { Account, AccountProvider } from '../../enterprise/entities/account'
import { User } from '../../enterprise/entities/user'
import type { AuthProvider } from '../auth/auth-provider'
import type { Encrypter } from '../cryptography/encrypter'
import { AccountsRepository } from '../repositories/accounts-repository'
import type { UsersRepository } from '../repositories/users-repository'

interface AuthenticateWithProviderUseCaseRequest {
	provider: AccountProvider
	code: string
}

type AuthenticateWithProviderUseCaseResponse = { token: string }

export class AuthenticateWithProviderUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private accountRepository: AccountsRepository,
		private authProvider: AuthProvider,
		private encrypter: Encrypter,
	) {}

	async execute({
		provider,
		code,
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

		const token = await this.encrypter.encrypt({ sub: user.id.toString() })

		return {
			token,
		}
	}
}
