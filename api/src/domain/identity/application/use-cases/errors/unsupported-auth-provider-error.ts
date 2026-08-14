import type { UseCaseError } from '@/core/types/errors/use-case-error'

export class UnsupportedAuthProviderError extends Error implements UseCaseError {
	constructor(provider: string) {
		super(`Unsupported auth provider: ${provider}`)
	}
}
