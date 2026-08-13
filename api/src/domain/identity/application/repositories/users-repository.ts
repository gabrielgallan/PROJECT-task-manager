import type { User } from '../../enterprise/entities/user'

export interface UsersRepository {
	create(user: User): Promise<void>
	findById(id: string): Promise<User | null>
	findByEmail(email: string): Promise<User | null>
	save(user: User): Promise<void>
}
