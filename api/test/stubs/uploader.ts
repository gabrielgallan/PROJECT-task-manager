import { randomUUID } from 'node:crypto'
import type { Uploader, UploadParams } from '@/domain/identity/application/storage/uploader'

interface Upload {
	fileName: string
	url: string
}

export class UploaderStub implements Uploader {
	public uploads: Upload[] = []

	async upload({ fileName }: UploadParams): Promise<{ url: string }> {
		const url = randomUUID()

		this.uploads.push({
			fileName,
			url,
		})

		return { url }
	}

	async uploadAvatar({ fileName }: UploadParams): Promise<{ url: string }> {
		const url = randomUUID()

		this.uploads.push({
			fileName,
			url,
		})

		return { url }
	}
}
