import { Injectable } from '@nestjs/common'
import { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'
import { Session } from '@/domain/identity/enterprise/entities/session'
import { PrismaSessionMapper } from '../mappers/prisma-session-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaSessionsRepository implements SessionsRepository {
	constructor(private prisma: PrismaService) {}

	async create(session: Session) {
		const data = PrismaSessionMapper.toPrisma(session)

		await this.prisma.session.create({
			data,
		})

		return
	}

	async findById(sessionId: string) {
		const session = await this.prisma.session.findUnique({
			where: {
				id: sessionId,
			},
		})

		if (!session) return null

		return PrismaSessionMapper.toDomain(session)
	}

	async findByTokenHash(tokenHash: string) {
		const session = await this.prisma.session.findUnique({
			where: {
				tokenHash,
			},
		})

		if (!session) return null

		return PrismaSessionMapper.toDomain(session)
	}

	async fetchActiveByUserId(userId: string) {
		const sessions = await this.prisma.session.findMany({
			where: {
				userId,
				revokedAt: null,
				expiresAt: {
					gt: new Date(),
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

		return sessions.map(PrismaSessionMapper.toDomain)
	}

	async revokeAllByUserId(userId: string, revokedAt: Date) {
		const { count } = await this.prisma.session.updateMany({
			where: {
				userId,
				revokedAt: null,
			},
			data: {
				revokedAt,
			},
		})

		return count
	}

	async save(session: Session) {
		await this.prisma.session.update({
			where: {
				id: session.id.toString(),
			},
			data: PrismaSessionMapper.toPrisma(session),
		})

		return
	}
}
