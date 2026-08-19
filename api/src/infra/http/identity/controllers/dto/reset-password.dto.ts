import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const resetPasswordSchema = z.object({
	tokenId: z.uuid(),
	password: z.string().min(6).max(18),
})

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
