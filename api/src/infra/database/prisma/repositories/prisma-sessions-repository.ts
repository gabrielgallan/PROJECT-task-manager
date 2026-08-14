import { Injectable } from "@nestjs/common";
import { SessionsRepository } from "@/domain/identity/application/repositories/sessions-repository";
import { Session } from "@/domain/identity/enterprise/entities/session";
import { PrismaSessionMapper } from "../mappers/prisma-session-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaSessionsRepository implements SessionsRepository {
    constructor(private prisma: PrismaService) { }

    async create(session: Session) {
        const data = PrismaSessionMapper.toPrisma(session)

        await this.prisma.session.create({
            data
        })

        return
    }

    async findByTokenHash(tokenHash: string) {
        const session = await this.prisma.session.findUnique({
            where: {
                tokenHash
            }
        })

        if (!session) return null

        return PrismaSessionMapper.toDomain(session)
    }
}