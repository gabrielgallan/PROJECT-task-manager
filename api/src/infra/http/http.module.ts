import { join } from 'node:path'
import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { IdentityModule } from './identity.module'

@Module({
	imports: [
		IdentityModule,
		ServeStaticModule.forRoot({
			rootPath: join(process.cwd(), '..', 'web', 'dist'),
			renderPath: '/',
		}),
	],
	controllers: [],
	providers: [],
})
export class HttpModule {}
