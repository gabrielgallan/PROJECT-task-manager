import type { Token } from '../../enterprise/entities/token'

export abstract class TokensRepository {
	abstract create(token: Token): Promise<void>
	abstract findById(id: string): Promise<Token | null>
	abstract save(token: Token): Promise<void>
}
