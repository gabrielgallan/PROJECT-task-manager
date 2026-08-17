import z from 'zod'

export const authenticateWithProviderSchema = z.object({
	code: z.string(),
})

export type AuthenticateWithProviderDto = z.infer<typeof authenticateWithProviderSchema>
