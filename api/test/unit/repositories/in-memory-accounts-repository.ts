import type { AccountsRepository } from '@/domain/identity/application/repositories/accounts-repository'
import type { Account, AccountProvider } from '@/domain/identity/enterprise/entities/account'

export class InMemoryAccountsRepository implements AccountsRepository {
	public items: Account[] = []

	async create(account: Account) {
		this.items.push(account)

		return
	}

	async findByProviderAndUserId(provider: AccountProvider, userId: string) {
		const account = this.items.find((item) => {
			return item.provider === provider && item.userId.toString() === userId
		})

		return account ?? null
	}
}
