import z from 'zod'

export const revokeSessionSchema = z.object({
	sessionId: z.uuid(),
})

export type RevokeSessionDto = z.infer<typeof revokeSessionSchema>
