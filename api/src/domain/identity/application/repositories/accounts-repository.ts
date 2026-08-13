import type { Account } from '../../enterprise/entities/account'

export interface AccountsRepository {
	create(account: Account): Promise<void>
	findByProviderAndUserId(provider: string, userId: string): Promise<Account | null>
}
