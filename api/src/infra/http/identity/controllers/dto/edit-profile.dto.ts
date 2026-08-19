import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const editProfileSchema = z.object({
	name: z.string().optional(),
	jobTitle: z.string().optional(),
})

export class EditProfileDto extends createZodDto(editProfileSchema) {}
