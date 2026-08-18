import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import cookieParser from 'cookie-parser'
import { envSchema } from './env/env'
import { EnvModule } from './env/env.module'
import { HttpModule } from './http/http.module'

@Module({
	imports: [
		EnvModule,
		HttpModule,
		ConfigModule.forRoot({
			validate: (env) => envSchema.parse(env),
			isGlobal: true,
		}),
	],
	controllers: [],
	providers: [],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(cookieParser()).forRoutes('*')
	}
}
