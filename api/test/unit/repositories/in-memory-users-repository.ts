import { Injectable } from '@nestjs/common'
import type { UsersRepository } from '@/domain/identity/application/repositories/users-repository'
import type { User } from '@/domain/identity/enterprise/entities/user'

@Injectable()
export class InMemoryUsersRepository implements UsersRepository {
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
}
