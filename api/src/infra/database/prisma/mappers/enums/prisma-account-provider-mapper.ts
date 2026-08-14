import type { AccountProvider as PrismaAccountProvider } from 'generated/prisma/enums';
import type { AccountProvider } from '@/domain/identity/enterprise/entities/account';

const toDomain = {
	GITHUB: 'GITHUB',
	GOOGLE: 'GOOGLE',
} as const satisfies Record<PrismaAccountProvider, AccountProvider>

const toPrisma = {
	GITHUB: 'GITHUB',
	GOOGLE: 'GOOGLE',
} as const satisfies Record<AccountProvider, PrismaAccountProvider>

export class PrismaAccountProviderMapper {
	static toPrisma(provider: AccountProvider): PrismaAccountProvider {
		return toPrisma[provider];
	}

	static toDomain(provider: PrismaAccountProvider): AccountProvider {
		return toDomain[provider];
	}
}