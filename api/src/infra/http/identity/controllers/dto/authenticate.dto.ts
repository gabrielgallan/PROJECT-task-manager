import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const authenticateSchema = z.object({
	email: z.email().nonempty(),
	password: z.string().min(6),
})

export class AuthenticateDto extends createZodDto(authenticateSchema) {}

export class AuthenticateResponseDto {
	@ApiProperty()
	success!: true
}
