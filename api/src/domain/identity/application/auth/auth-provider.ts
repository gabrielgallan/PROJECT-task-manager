export interface UserProps {
	id: string | null
	name: string | null
	email: string
	avatarUrl: string | null
}

export interface SignInData {
	code: string
}

export abstract class AuthProvider<TUser extends UserProps = UserProps, TSignInData = SignInData> {
	abstract signIn(data: TSignInData): Promise<TUser>
}
