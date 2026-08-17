import z from 'zod'

export const resetPasswordSchema = z.object({
	tokenId: z.string(),
	password: z.string().min(6).max(18),
})

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>
