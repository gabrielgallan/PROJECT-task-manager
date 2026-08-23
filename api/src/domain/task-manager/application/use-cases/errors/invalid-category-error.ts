import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class InvalidCategoryError extends Error implements UseCaseError {
	constructor(message: string) {
		super(message)
	}
}
