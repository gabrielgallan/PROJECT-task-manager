import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class InvalidTimeZoneError extends Error implements UseCaseError {
	constructor() {
		super('Invalid IANA time zone')
	}
}
