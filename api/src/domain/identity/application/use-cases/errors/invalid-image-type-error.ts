import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class InvalidImageTypeError extends Error implements UseCaseError {
	constructor() {
		super('Invalid image type.')
	}
}
