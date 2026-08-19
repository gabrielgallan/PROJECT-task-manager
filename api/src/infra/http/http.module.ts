import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { EnvModule } from '../env/env.module'
import { IdentityModule } from './identity/identity.module'
import { TaskManagerModule } from './task-manager/task-manager.module'

@Module({
	imports: [
		EnvModule,
		IdentityModule,
		TaskManagerModule,
		ServeStaticModule.forRoot({
			rootPath: join(process.cwd(), '..', 'web', 'dist'),
			renderPath: '/',
		}),
	],
	controllers: [],
	providers: [],
})
export class HttpModule {}
