import { Module } from '@nestjs/common'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'
import { AuthenticateWithProviderUseCase } from '@/domain/identity/application/use-cases/authenticate-with-provider'
import { ChangePasswordUseCase } from '@/domain/identity/application/use-cases/change-password'
import { DeleteUserUseCase } from '@/domain/identity/application/use-cases/delete-user'
import { EditProfileUseCase } from '@/domain/identity/application/use-cases/edit-profile'
import { FetchSessionsUseCase } from '@/domain/identity/application/use-cases/fetch-sessions'
import { GetProfileUseCase } from '@/domain/identity/application/use-cases/get-profile'
import { RegisterUseCase } from '@/domain/identity/application/use-cases/register'
import { RequestPasswordRecoverUseCase } from '@/domain/identity/application/use-cases/request-password-recover'
import { ResetPasswordUseCase } from '@/domain/identity/application/use-cases/reset-password'
import { RevokeAllSessionsUseCase } from '@/domain/identity/application/use-cases/revoke-all-sessions'
import { RevokeSessionUseCase } from '@/domain/identity/application/use-cases/revoke-session'
import { UploadAvatarUseCase } from '@/domain/identity/application/use-cases/upload-avatar'
import { AuthModule } from '../../auth/auth.module'
import { CryptographyModule } from '../../cryptography/cryptography.module'
import { DatabaseModule } from '../../database/database.module'
import { EmailModule } from '../../email/email.module'
import { StorageModule } from '../../storage/storage.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { AuthenticateWithGithubController } from './controllers/authenticate-with-github.controller'
import { AuthenticateWithGoogleController } from './controllers/authenticate-with-google.controller'
import { ChangePasswordController } from './controllers/change-password.controller'
import { DeleteUserController } from './controllers/delete-user.controller'
import { EditProfileController } from './controllers/edit-profile.controller'
import { FetchSessionController } from './controllers/fetch-sessions.controller'
import { GetProfileController } from './controllers/get-profile.controller'
import { RegisterController } from './controllers/register.controller'
import { RequestPasswordRecoverController } from './controllers/request-password-recover.controller'
import { ResetPasswordController } from './controllers/reset-password.controller'
import { RevokeAllSessionsController } from './controllers/revoke-all-sessions.controller'
import { RevokeSessionController } from './controllers/revoke-session.controller'
import { SignOutController } from './controllers/sign-out.controller'
import { UploadAvatarController } from './controllers/upload-avatar.controller'

@Module({
	imports: [DatabaseModule, AuthModule, CryptographyModule, EmailModule, StorageModule],
	controllers: [
		RegisterController,
		AuthenticateController,
		AuthenticateWithGithubController,
		AuthenticateWithGoogleController,
		GetProfileController,
		EditProfileController,
		RequestPasswordRecoverController,
		ResetPasswordController,
		FetchSessionController,
		RevokeSessionController,
		RevokeAllSessionsController,
		SignOutController,
		DeleteUserController,
		UploadAvatarController,
		ChangePasswordController,
	],
	providers: [
		RegisterUseCase,
		AuthenticateUseCase,
		AuthenticateWithProviderUseCase,
		GetProfileUseCase,
		EditProfileUseCase,
		RequestPasswordRecoverUseCase,
		ResetPasswordUseCase,
		FetchSessionsUseCase,
		RevokeSessionUseCase,
		RevokeAllSessionsUseCase,
		DeleteUserUseCase,
		UploadAvatarUseCase,
		ChangePasswordUseCase,
	],
})
export class IdentityModule {}
