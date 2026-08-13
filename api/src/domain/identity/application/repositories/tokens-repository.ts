import type { Token } from '../../enterprise/entities/token'

export interface TokensRepository {
	create(token: Token): Promise<void>
	findById(id: string): Promise<Token | null>
	save(token: Token): Promise<void>
}
