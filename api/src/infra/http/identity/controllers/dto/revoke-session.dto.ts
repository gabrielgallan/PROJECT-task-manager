import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const revokeSessionSchema = z.object({
	sessionId: z.uuid(),
})

export class RevokeSessionDto extends createZodDto(revokeSessionSchema) {}
