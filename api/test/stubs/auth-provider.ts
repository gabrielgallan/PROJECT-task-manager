import type { AuthProvider, SignInData, UserProps } from '@/domain/identity/application/auth/auth-provider'
import type { AccountProvider } from '@/domain/identity/enterprise/entities/account'

export class AuthProviderStub implements AuthProvider {
	constructor(readonly provider: AccountProvider = 'GITHUB') {}

	async signIn(_data: SignInData): Promise<UserProps> {
		return {
			id: '-user-id',
			email: 'johndoe@example.com',
			name: 'John Doe',
			avatarUrl: 'https://example.com/avatar.jpg',
		}
	}
}
