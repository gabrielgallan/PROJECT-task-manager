import { Injectable } from "@nestjs/common";
import { AccountProvider } from "@/../generated/prisma/client";
import { AccountsRepository } from "@/domain/identity/application/repositories/accounts-repository";
import { Account } from "@/domain/identity/enterprise/entities/account";
import { PrismaAccountMapper } from "../mappers/prisma-account-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaAccountsRepository implements AccountsRepository {
    constructor(private prisma: PrismaService) { }

    async create(account: Account) {
        const data = PrismaAccountMapper.toPrisma(account)

        await this.prisma.account.create({
            data
        })
    }

    async findByProviderAndUserId(provider: string, userId: string) {
        let prismaProvider: AccountProvider

        switch (provider) {
            case 'GITHUB':
                prismaProvider = AccountProvider.GITHUB
                break
            default:
                throw new Error(`Invalid provider: ${provider}`)
        }

        const account = await this.prisma.account.findUnique({
            where: {
                provider_userId: {
                    provider: prismaProvider,
                    userId
                }
            }
        })

        if (!account) {
            return null
        }

        return PrismaAccountMapper.toDomain(account)
    }
}