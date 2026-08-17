import z from 'zod'

export const requestPasswordRecoverSchema = z.object({
	email: z.email(),
})

export type RequestPasswordRecoverDto = z.infer<typeof requestPasswordRecoverSchema>
