import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ValidateSessionTokenUseCase } from '@/domain/identity/application/use-cases/validate-session-token'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { DatabaseModule } from '../database/database.module'
import { SessionAuthGuard } from './session-auth.guard'

@Module({
	imports: [DatabaseModule, CryptographyModule],
	providers: [
		ValidateSessionTokenUseCase,
		{
			provide: APP_GUARD,
			useClass: SessionAuthGuard,
		},
	],
})
export class AuthModule {}
