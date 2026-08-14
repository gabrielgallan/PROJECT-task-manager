import type { AuthProvider } from '@/domain/identity/application/auth/auth-provider'
import { AuthProviderRegistry } from '@/domain/identity/application/auth/auth-provider-registry'
import { UnsupportedAuthProviderError } from '@/domain/identity/application/use-cases/errors/unsupported-auth-provider-error'
import type { AccountProvider } from '@/domain/identity/enterprise/entities/account'

export class MapAuthProviderRegistry extends AuthProviderRegistry {
	private providers: Map<AccountProvider, AuthProvider>

	constructor(providers: AuthProvider[]) {
		super()

		this.providers = new Map(providers.map((authProvider) => [authProvider.provider, authProvider]))
	}

	get(provider: AccountProvider) {
		const authProvider = this.providers.get(provider)

		if (!authProvider) {
			throw new UnsupportedAuthProviderError(provider)
		}

		return authProvider
	}
}
