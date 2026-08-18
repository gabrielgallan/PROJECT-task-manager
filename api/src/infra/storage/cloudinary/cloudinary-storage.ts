import { Readable } from 'node:stream'
import { BadGatewayException, Injectable } from '@nestjs/common'
import { type UploadApiResponse, v2 } from 'cloudinary'
import { Uploader, UploadParams } from '@/domain/identity/application/storage/uploader'
import { EnvService } from '@/infra/env/env.service'

type CloudinaryClient = typeof v2

type UploadOptions = {
	folder: string
	transformation?: object[]
	resource_type?: 'image' | 'video' | 'raw' | 'auto'
}

@Injectable()
export class CloudinaryStorage implements Uploader {
	private client: CloudinaryClient

	constructor(private env: EnvService) {
		this.client = v2

		this.client.config({
			cloud_name: this.env.get('CLOUDINARY_CLOUD_NAME'),
			api_key: this.env.get('CLOUDINARY_API_KEY'),
			api_secret: this.env.get('CLOUDINARY_API_SECRET'),
		})
	}

	private async uploadToCloudinary(
		{ fileName, body }: UploadParams,
		options: UploadOptions,
	): Promise<{ url: string }> {
		try {
			const result = await new Promise<UploadApiResponse>((resolve, reject) => {
				const stream = this.client.uploader.upload_stream(
					{
						public_id: fileName,
						resource_type: options.resource_type ?? 'image',
						folder: options.folder,
						transformation: options.transformation,
					},
					(error, result) => {
						if (error) return reject(error)
						if (!result) return reject(new Error('Upload failed'))
						resolve(result)
					},
				)

				Readable.from(body).pipe(stream)
			})

			return { url: result.secure_url }
		} catch (error: any) {
			throw new BadGatewayException(error.message ?? 'Cloudinary upload error')
		}
	}

	async uploadAvatar(params: UploadParams): Promise<{ url: string }> {
		return this.uploadToCloudinary(params, {
			folder: 'avatars',
			transformation: [{ width: 256, height: 256, crop: 'fill' }],
		})
	}
}
