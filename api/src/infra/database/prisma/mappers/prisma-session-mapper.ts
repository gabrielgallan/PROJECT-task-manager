import { Session as PrismaSession } from "generated/prisma/client";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Session } from "@/domain/identity/enterprise/entities/session";

export class PrismaSessionMapper {
    static toDomain(raw: PrismaSession): Session {
        return Session.create({
            userId: new UniqueEntityID(raw.userId),
            tokenHash: raw.tokenHash,
            ipAddress: raw.ipAddress,
            userAgent: raw.userAgent,
            expiresAt: raw.expiresAt,
            createdAt: raw.createdAt,
            revokedAt: raw.revokedAt
        }, new UniqueEntityID(raw.id))
    }

    static toPrisma(session: Session): PrismaSession {
        return {
            id: session.id.toString(),
            userId: session.userId.toString(),
            tokenHash: session.tokenHash,
            ipAddress: session.ipAddress ?? null,
            userAgent: session.userAgent ?? null,
            expiresAt: session.expiresAt,
            revokedAt: session.revokedAt ?? null,
            createdAt: session.createdAt
        }
    }
}