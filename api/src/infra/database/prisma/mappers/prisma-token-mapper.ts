import type { Prisma, Token as PrismaToken } from 'generated/prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Token } from '@/domain/identity/enterprise/entities/token';
import { PrismaTokenTypeMapper } from './enums/prisma-token-type-mapper';

export class PrismaTokenMapper {
	static toDomain(raw: PrismaToken): Token {
		return Token.create(
			{
				userId: new UniqueEntityID(raw.userId),
				type: PrismaTokenTypeMapper.toDomain(raw.type),
				usedAt: raw.usedAt,
				expiresAt: raw.expiresAt,
				createdAt: raw.createdAt,
			},
			new UniqueEntityID(raw.id),
		);
	}

	static toPrisma(token: Token): Prisma.TokenUncheckedCreateInput {
		return {
			id: token.id.toString(),
			type: PrismaTokenTypeMapper.toPrisma(token.type),
			usedAt: token.usedAt ?? null,
			expiresAt: token.expiresAt,
			createdAt: token.createdAt,
			userId: token.userId.toString(),
		};
	}
}