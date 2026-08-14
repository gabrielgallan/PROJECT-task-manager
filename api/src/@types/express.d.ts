import type { UserPayload } from '@/infra/auth/user-payload'

declare global {
	namespace Express {
		interface Request {
			user?: UserPayload
		}
	}
}
