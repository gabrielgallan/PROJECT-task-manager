import { Module } from '@nestjs/common'
import { AuthenticateUseCase } from '@/domain/identity/application/use-cases/authenticate'
import { CryptographyModule } from '../cryptography/cryptography.module'
import { DatabaseModule } from '../database/database.module'
import { AuthenticateController } from './controllers/authenticate.controller'
import { HealthController } from './controllers/health.controller'

@Module({
	imports: [DatabaseModule, CryptographyModule],
	controllers: [HealthController, AuthenticateController],
	providers: [AuthenticateUseCase],
})
export class HttpModule {}
