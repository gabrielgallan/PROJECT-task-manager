import { compare, hash } from 'bcryptjs'
import type { Hasher } from '@/domain/identity/application/cryptography/hasher'

export class HasherStub implements Hasher {
	async generate(plain: string) {
		const hashed = await hash(plain, 8)

		return hashed
	}

	async compare(plain: string, hash: string) {
		return await compare(plain, hash)
	}
}
