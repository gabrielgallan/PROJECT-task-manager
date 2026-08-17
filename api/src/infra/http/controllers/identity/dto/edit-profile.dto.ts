import z from 'zod'

export const editProfileSchema = z.object({
	name: z.string().optional(),
	jobTitle: z.string().optional(),
})

export type EditProfileDto = z.infer<typeof editProfileSchema>
