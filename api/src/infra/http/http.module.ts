import { Module } from '@nestjs/common'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'
import { EditProfileUseCase } from '@/domain/identity/application/use-cases/edit-profile'
import { GetProfileUseCase } from '@/domain/identity/application/use-cases/get-profile'
import { RegisterUseCase } from '@/domain/identity/application/use-cases/register'
import { ResetPasswordUseCase } from '@/domain/identity/application/use-cases/reset-password'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { DatabaseModule } from '../database/database.module'
import { EnvModule } from '../env/env.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { EditProfileController } from './controllers/edit-profile.controller'
import { GetProfileController } from './controllers/get-profile.controller'
import { HealthController } from './controllers/health.controller'
import { RegisterController } from './controllers/register.controller'
import { ResetPasswordController } from './controllers/reset-password.controller'

@Module({
	imports: [
		EnvModule, 
		DatabaseModule, 
		CryptographyModule
	],
	controllers: [
		HealthController, 
		AuthenticateController, 
		RegisterController, 
		GetProfileController, 
		EditProfileController, 
		ResetPasswordController
	],
	providers: [
		AuthenticateUseCase, 
		RegisterUseCase, 
		GetProfileUseCase, 
		EditProfileUseCase, 
		ResetPasswordUseCase
	],
})
export class HttpModule {}
