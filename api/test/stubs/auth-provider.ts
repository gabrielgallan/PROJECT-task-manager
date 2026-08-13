import type { AuthProvider, UserProps } from '@/domain/identity/application/auth/auth-provider'

interface Props extends UserProps {
	code: string
}

interface SignInData {
	code: string
}

export class AuthProviderStub implements AuthProvider<Props, SignInData> {
	async signIn({ code }: SignInData) {
		return {
			id: '-user-id',
			email: 'johndoe@example.com',
			name: 'John Doe',
			avatarUrl: 'https://example.com/avatar.jpg',
			code,
		}
	}
}
