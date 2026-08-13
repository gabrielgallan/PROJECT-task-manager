import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class InvalidTokenError extends Error implements UseCaseError {
	constructor(message?: string) {
		super(message || 'Invalid token error')
	}
}
