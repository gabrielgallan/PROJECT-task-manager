import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
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
import { AuthenticateController } from './controllers/identity/authenticate.controller'
import { AuthenticateWithGithubController } from './controllers/identity/authenticate-with-github.controller'
import { AuthenticateWithGoogleController } from './controllers/identity/authenticate-with-google.controller'
import { EditProfileController } from './controllers/identity/edit-profile.controller'
import { GetProfileController } from './controllers/identity/get-profile.controller'
import { RegisterController } from './controllers/identity/register.controller'
import { RequestPasswordRecoverController } from './controllers/identity/request-password-recover.controller'
import { ResetPasswordController } from './controllers/identity/reset-password.controller'

@Module({
	imports: [
		EnvModule,
		AuthModule,
		CryptographyModule,
		DatabaseModule,
		EmailModule,
		ServeStaticModule.forRoot({
			rootPath: join(process.cwd(), '..', 'web', 'dist'),
			renderPath: '/',
		}),
	],
	controllers: [
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
