export interface UserProps {
	id: string | null
	name: string | null
	email: string
	avatarUrl: string | null
}

export interface SignInData {
	code: string
}

export interface AuthProvider<TUser extends UserProps = UserProps, TSignInData = SignInData> {
	signIn(data: TSignInData): Promise<TUser>
}
