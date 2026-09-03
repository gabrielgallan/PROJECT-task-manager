import 'dotenv/config'
import z from 'zod'

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
	PORT: z.coerce.number().default(8000),
	DATABASE_URL: z.url(),

	GITHUB_OAUTH_CLIENT_ID: z.string(),
	GITHUB_OAUTH_CLIENT_SECRET: z.string(),
	GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.url(),

	GOOGLE_OAUTH_CLIENT_ID: z.string(),
	GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
	GOOGLE_OAUTH_CLIENT_REDIRECT_URI: z.url(),

	RESEND_API_KEY: z.string(),

	CLOUDINARY_API_KEY: z.string(),
	CLOUDINARY_API_SECRET: z.string(),
	CLOUDINARY_CLOUD_NAME: z.string(),

	REDIS_URL: z.url(),

	FRONTEND_URL: z.url(),
	CORS_ORIGINS: z.string().default('*'),
})

export type Env = z.infer<typeof envSchema>
