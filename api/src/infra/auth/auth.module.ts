import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import type { AuthProvider } from '@/domain/identity/application/auth/auth-provider'
import { AuthProviderRegistry } from '@/domain/identity/application/auth/auth-provider-registry'
import { ValidateSessionTokenUseCase } from '@/domain/identity/application/use-cases/validate-session-token'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { DatabaseModule } from '../database/database.module'
import { EnvModule } from '../env/env.module'
import { GithubOAuthProvider } from './github-oauth-provider'
import { GoogleOAuthProvider } from './google-oauth-provider'
import { MapAuthProviderRegistry } from './map-auth-provider-registry'
import { SessionAuthGuard } from './session-auth.guard'

@Module({
	imports: [DatabaseModule, CryptographyModule, EnvModule],
	providers: [
		ValidateSessionTokenUseCase,
		{
			provide: APP_GUARD,
			useClass: SessionAuthGuard,
		},
		GithubOAuthProvider,
		GoogleOAuthProvider,
		{
			provide: AuthProviderRegistry,
			useFactory: (...providers: AuthProvider[]) => new MapAuthProviderRegistry(providers),
			// Cada novo provider entra aqui e se registra sozinho pela chave que declara
			inject: [GithubOAuthProvider, GoogleOAuthProvider],
		},
	],
	exports: [AuthProviderRegistry],
})
export class AuthModule {}
