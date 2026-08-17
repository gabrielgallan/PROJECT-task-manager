import z from 'zod'

export const registerSchema = z.object({
	name: z.string(),
	email: z.email(),
	password: z.string().min(6).max(18),
	jobTitle: z.string().optional(),
})

export type RegisterDto = z.infer<typeof registerSchema>
