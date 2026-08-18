import { Module } from '@nestjs/common'
import { Uploader } from '@/domain/identity/application/storage/uploader'
import { EnvModule } from '../env/env.module'
import { CloudinaryStorage } from './cloudinary/cloudinary-storage'

@Module({
	imports: [EnvModule],
	exports: [Uploader],
	providers: [
		{
			provide: Uploader,
			useClass: CloudinaryStorage,
		},
	],
})
export class StorageModule {}
