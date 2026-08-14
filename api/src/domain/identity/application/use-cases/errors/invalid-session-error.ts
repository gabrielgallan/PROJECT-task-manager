import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class InvalidSessionError extends Error implements UseCaseError {
    constructor() {
        super('Invalid session')
    }
}
