import 'dotenv/config'
import z from 'zod'

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
	PORT: z.coerce.number().default(8000),
	// DATABASE_URL: z.url(),

	// JWT_PRIVATE_KEY: z.string(),
	// JWT_PUBLIC_KEY: z.string(),

	// GITHUB_OAUTH_CLIENT_ID: z.string(),
	// GITHUB_OAUTH_CLIENT_SECRET: z.string(),
	// GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.string(),

	// GOOGLE_OAUTH_CLIENT_ID: z.string(),
	// GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
	// GOOGLE_OAUTH_CLIENT_REDIRECT_URI: z.string(),

	// RESEND_API_KEY: z.string(),

	// CLOUDINARY_API_KEY: z.string(),
	// CLOUDINARY_API_SECRET: z.string(),
	// CLOUDINARY_CLOUD_NAME: z.string(),

	// WEB_URL: z.url(),
})

export type Env = z.infer<typeof envSchema>
