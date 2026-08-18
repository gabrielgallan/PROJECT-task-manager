import { ApiProperty } from '@nestjs/swagger'
import z from 'zod'

export const authenticateSchema = z.object({
	email: z.email(),
	password: z.string(),
})

export type AuthenticateDto = z.infer<typeof authenticateSchema>

export class AuthenticateResponseDto {
	@ApiProperty()
	success: true
}
