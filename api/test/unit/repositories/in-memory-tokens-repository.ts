import { Injectable } from '@nestjs/common'
import type { TokensRepository } from '@/domain/identity/application/repositories/tokens-repository'
import type { Token } from '@/domain/identity/enterprise/entities/token'

@Injectable()
export class InMemoryTokensRepository implements TokensRepository {
	public items: Token[] = []

	async create(token: Token) {
		this.items.push(token)

		return
	}

	async findById(id: string) {
		const token = this.items.find((token) => token.id.toString() === id) || null

		return token
	}

	async save(token: Token) {
		const tokenIndex = this.items.findIndex((item) => item.id.toString() === token.id.toString())

		if (tokenIndex >= 0) {
			this.items[tokenIndex] = token
		}

		return
	}
}
