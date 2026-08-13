import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class UserAlreadyExistsError extends Error implements UseCaseError {
	constructor() {
		super('User already exists')
	}
}
