import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'
import { Hasher } from '@/domain/identity/application/cryptography/hasher'

@Injectable()
export class BcryptHasher implements Hasher {
	async generate(plain: string) {
		const hashed = await hash(plain, 8)

		return hashed
	}

	async compare(plain: string, hash: string) {
		return await compare(plain, hash)
	}
}
