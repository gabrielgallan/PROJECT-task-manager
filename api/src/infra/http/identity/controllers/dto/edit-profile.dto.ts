import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const editProfileSchema = z.object({
	name: z.string().nullish(),
	jobTitle: z.string().nullish(),
})

export class EditProfileDto extends createZodDto(editProfileSchema) {}
