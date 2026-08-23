import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class PlanAlreadyConfirmedError extends Error implements UseCaseError {
	constructor() {
		super('Plan is already confirmed')
	}
}
