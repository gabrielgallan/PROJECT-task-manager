import { Injectable } from "@nestjs/common";
import { TokensRepository } from "@/domain/identity/application/repositories/tokens-repository";
import { Token } from "@/domain/identity/enterprise/entities/token";
import { PrismaTokenMapper } from "../mappers/prisma-token-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaTokensRepository implements TokensRepository {
    constructor(private prisma: PrismaService) { }

    async create(token: Token) {
        const data = PrismaTokenMapper.toPrisma(token)

        await this.prisma.token.create({
            data
        })

        return
    }

    async findById(id: string) {
        const token = await this.prisma.token.findUnique({
            where: {
                id
            }
        })

        if (!token) {
            return null
        }

        return PrismaTokenMapper.toDomain(token)
    }

    async save(token: Token) {
        const data = PrismaTokenMapper.toPrisma(token)

        await this.prisma.token.update({
            where: {
                id: token.id.toString()
            },
            data
        })

        return
    }
}