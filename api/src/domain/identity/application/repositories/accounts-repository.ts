import type { Account } from '../../enterprise/entities/account'

export abstract class AccountsRepository {
	abstract create(account: Account): Promise<void>
	abstract findByProviderAndUserId(provider: string, userId: string): Promise<Account | null>
}
