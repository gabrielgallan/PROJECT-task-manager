import { Injectable } from "@nestjs/common";
import { UsersRepository } from "@/domain/identity/application/repositories/users-repository";
import { User } from "@/domain/identity/enterprise/entities/user";
import { PrismaUserMapper } from "../mappers/prisma-user-mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
    constructor(private prisma: PrismaService) { }

    async create(user: User) {
        const data = PrismaUserMapper.toPrisma(user)

        await this.prisma.user.create({
            data
        })

        return
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id
            }
        })

        if (!user) {
            return null
        }

        return PrismaUserMapper.toDomain(user)
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                email
            }
        })

        if (!user) {
            return null
        }

        return PrismaUserMapper.toDomain(user)
    }

    async save(user: User) {
        const data = PrismaUserMapper.toPrisma(user)

        await this.prisma.user.update({
            where: {
                id: user.id.toString()
            },
            data
        })

        return
    }
}