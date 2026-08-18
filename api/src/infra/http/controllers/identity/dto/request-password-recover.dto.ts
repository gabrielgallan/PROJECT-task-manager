import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const requestPasswordRecoverSchema = z.object({
	email: z.email(),
})

export class RequestPasswordRecoverDto extends createZodDto(requestPasswordRecoverSchema) {}
