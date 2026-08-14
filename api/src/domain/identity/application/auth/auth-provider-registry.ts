import type { AccountProvider } from '../../enterprise/entities/account'
import type { AuthProvider } from './auth-provider'

export abstract class AuthProviderRegistry {
	abstract get(provider: AccountProvider): AuthProvider
}
