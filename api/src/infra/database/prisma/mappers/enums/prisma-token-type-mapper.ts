import type { TokenType as PrismaTokenType } from 'generated/prisma/client';
import type { TokenType } from '@/domain/identity/enterprise/entities/token';

const toDomain = {
	PASSWORD_RECOVER: 'PASSWORD_RECOVER'
} as const satisfies Record<PrismaTokenType, TokenType>

const toPrisma = {
	PASSWORD_RECOVER: 'PASSWORD_RECOVER'
} as const satisfies Record<TokenType, PrismaTokenType>

export class PrismaTokenTypeMapper {
	static toDomain(type: PrismaTokenType): TokenType {
		return toDomain[type]
	}

	static toPrisma(type: TokenType): PrismaTokenType {
		return toPrisma[type]
	}
}