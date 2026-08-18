import { User } from '@/domain/identity/enterprise/entities/user'

export class UserPresenter {
	static toHTTP(user: User) {
		return {
			name: user.name ?? null,
			email: user.email,
			jobTitle: user.jobTitle ?? null,
			avatarUrl: user.avatarUrl ?? null,
		}
	}
}
