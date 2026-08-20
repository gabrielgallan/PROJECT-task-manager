import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class InvalidDatetimeError extends Error implements UseCaseError {
	constructor(msg?: string) {
		super(msg ?? 'Invalid datetime error')
	}
}
