import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class InvalidCredentialsError extends Error implements UseCaseError {
	constructor() {
		super('Invalid credentials error')
	}
}
