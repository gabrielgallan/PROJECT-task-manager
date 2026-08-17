import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { User } from '@/domain/identity/enterprise/entities/user'
import { InMemoryAccountsRepository } from './in-memory-accounts-repository'
import { InMemorySessionsRepository } from './in-memory-sessions-repository'
import { InMemoryTokensRepository } from './in-memory-tokens-repository'

export class InMemoryUsersRepository implements UsersRepository {
	constructor(
		private sessionsRepository: InMemorySessionsRepository,
		private accountsRepository: InMemoryAccountsRepository,
		private tokensRepository: InMemoryTokensRepository,
	) {}

	public items: User[] = []

	async create(user: User) {
		this.items.push(user)

		return
	}

	async findById(id: string) {
		const user = this.items.find((u) => u.id.toString() === id)

		if (!user) return null

		return user
	}

	async findByEmail(email: string) {
		const user = this.items.find((u) => u.email === email)

		if (!user) return null

		return user
	}

	async save(user: User) {
		const userIndex = this.items.findIndex((u) => u.id.toString() === user.id.toString())

		if (userIndex >= 0) {
			this.items[userIndex] = user
		}

		return
	}

	async delete(user: User) {
		this.sessionsRepository.items = this.sessionsRepository.items.filter(
			(s) => s.userId.toString() !== user.id.toString(),
		)

		this.tokensRepository.items = this.tokensRepository.items.filter(
			(t) => t.userId.toString() !== user.id.toString(),
		)

		this.accountsRepository.items = this.accountsRepository.items.filter(
			(a) => a.userId.toString() !== user.id.toString(),
		)

		this.items = this.items.filter((u) => u.id.toString() !== user.id.toString())

		return
	}
}
