import { Module } from '@nestjs/common'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'
import { AuthenticateWithProviderUseCase } from '@/domain/identity/application/use-cases/authenticate-with-provider'
import { EditProfileUseCase } from '@/domain/identity/application/use-cases/edit-profile'
import { GetProfileUseCase } from '@/domain/identity/application/use-cases/get-profile'
import { RegisterUseCase } from '@/domain/identity/application/use-cases/register'
import { RequestPasswordRecoverUseCase } from '@/domain/identity/application/use-cases/request-password-recover'
import { ResetPasswordUseCase } from '@/domain/identity/application/use-cases/reset-password'
import { AuthModule } from '../auth/auth.module'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { DatabaseModule } from '../database/database.module'
import { EmailModule } from '../email/email.module'
import { EnvModule } from '../env/env.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { AuthenticateWithGithubController } from './controllers/authenticate-with-github.controller'
import { AuthenticateWithGoogleController } from './controllers/authenticate-with-google.controller'
import { EditProfileController } from './controllers/edit-profile.controller'
import { GetProfileController } from './controllers/get-profile.controller'
import { HealthController } from './controllers/health.controller'
import { RegisterController } from './controllers/register.controller'
import { RequestPasswordRecoverController } from './controllers/request-password-recover.controller'
import { ResetPasswordController } from './controllers/reset-password.controller'

@Module({
	imports: [EnvModule, DatabaseModule, CryptographyModule, AuthModule, EmailModule],
	controllers: [
		HealthController,
		AuthenticateController,
		AuthenticateWithGithubController,
		AuthenticateWithGoogleController,
		RegisterController,
		GetProfileController,
		EditProfileController,
		ResetPasswordController,
		RequestPasswordRecoverController,
	],
	providers: [
		AuthenticateUseCase,
		AuthenticateWithProviderUseCase,
		RegisterUseCase,
		GetProfileUseCase,
		EditProfileUseCase,
		ResetPasswordUseCase,
		RequestPasswordRecoverUseCase,
	],
})
export class HttpModule {}
