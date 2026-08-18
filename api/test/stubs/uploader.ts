import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { Uploader, UploadParams } from '@/domain/identity/application/storage/uploader'

interface Upload {
	fileName: string
	url: string
}

@Injectable()
export class UploaderStub implements Uploader {
	public uploads: Upload[] = []

	async uploadAvatar({ fileName }: UploadParams): Promise<{ url: string }> {
		const url = randomUUID()

		this.uploads.push({
			fileName,
			url,
		})

		return { url }
	}
}
