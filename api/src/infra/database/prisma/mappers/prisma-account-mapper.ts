import { Account as PrismaAccount } from "@/../generated/prisma/client";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Account } from "@/domain/identity/enterprise/entities/account";
import { PrismaAccountProviderMapper } from "./enums/prisma-account-provider-mapper";

export class PrismaAccountMapper {
    static toDomain(raw: PrismaAccount): Account {
        return Account.create({
            userId: new UniqueEntityID(raw.userId),
            provider: PrismaAccountProviderMapper.toDomain(raw.provider),
            providerUserId: raw.providerAccountId
        },
            new UniqueEntityID(raw.id)
        )
    }

    static toPrisma(account: Account): PrismaAccount {
        return {
            id: account.id.toString(),
            provider: PrismaAccountProviderMapper.toPrisma(account.provider),
            providerAccountId: account.providerUserId ?? null,
            userId: account.userId.toString()
        }
    }
}