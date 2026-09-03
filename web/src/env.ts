import z from 'zod'

const envSchema = z.object({
	VITE_API_URL: z.url(),

	VITE_GITHUB_OAUTH_CLIENT_ID: z.string(),
	VITE_GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.string(),

	VITE_GOOGLE_OAUTH_CLIENT_ID: z.string(),
	VITE_GOOGLE_OAUTH_REDIRECT_URI: z.string(),
})

const env = envSchema.parse(import.meta.env)

export { env }
