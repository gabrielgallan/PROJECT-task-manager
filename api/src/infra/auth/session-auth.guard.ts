import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { ValidateSessionTokenUseCase } from '@/domain/identity/application/use-cases/validate-session-token'
import { IS_PUBLIC_KEY } from './public.decorator'
import { SESSION_COOKIE_NAME } from './session-cookie'

@Injectable()
export class SessionAuthGuard implements CanActivate {
	constructor(
		private readonly validateSessionToken: ValidateSessionTokenUseCase,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		])

		if (isPublic) {
			return true
		}

		const request = context.switchToHttp().getRequest<Request>()

		const token = request.cookies?.[SESSION_COOKIE_NAME]

		if (!token) {
			throw new UnauthorizedException()
		}

		const result = await this.validateSessionToken.execute({ token })

		if (result.isLeft()) {
			throw new UnauthorizedException()
		}

		const { userId, sessionId } = result.value

		request.user = { id: userId, sessionId }

		return true
	}
}
