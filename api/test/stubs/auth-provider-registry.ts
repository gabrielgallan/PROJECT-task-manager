import type { AuthProvider } from '@/domain/identity/application/auth/auth-provider'
import { AuthProviderRegistry } from '@/domain/identity/application/auth/auth-provider-registry'
import { UnsupportedAuthProviderError } from '@/domain/identity/application/use-cases/errors/unsupported-auth-provider-error'
import type { AccountProvider } from '@/domain/identity/enterprise/entities/account'

export class AuthProviderRegistryStub extends AuthProviderRegistry {
	private providers = new Map<AccountProvider, AuthProvider>()

	register(authProvider: AuthProvider) {
		this.providers.set(authProvider.provider, authProvider)

		return this
	}

	get(provider: AccountProvider) {
		const authProvider = this.providers.get(provider)

		if (!authProvider) {
			throw new UnsupportedAuthProviderError(provider)
		}

		return authProvider
	}
}
