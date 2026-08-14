import type { Account, AccountProvider } from '../../enterprise/entities/account'

export abstract class AccountsRepository {
	abstract create(account: Account): Promise<void>
	abstract findByProviderAndUserId(provider: AccountProvider, userId: string): Promise<Account | null>
}
