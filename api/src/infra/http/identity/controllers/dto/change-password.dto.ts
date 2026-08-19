import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const changePasswordSchema = z.object({
	currentPassword: z.string().nonempty(),
	newPassword: z.string().min(6).max(18),
})

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
