import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const authenticateWithProviderSchema = z.object({
	code: z.string(),
})

export class AuthenticateWithProviderDto extends createZodDto(authenticateWithProviderSchema) {}
