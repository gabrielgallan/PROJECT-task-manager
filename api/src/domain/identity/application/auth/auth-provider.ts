import type { AccountProvider } from '../../enterprise/entities/account'

export interface UserProps {
	id: string | null
	name: string | null
	email: string
	avatarUrl: string | null
}

export interface SignInData {
	code: string
}

export abstract class AuthProvider {
	abstract readonly provider: AccountProvider

	abstract signIn(data: SignInData): Promise<UserProps>
}
