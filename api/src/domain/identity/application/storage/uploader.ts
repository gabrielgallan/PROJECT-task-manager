import type { Readable } from 'node:stream'

export interface UploadParams {
	fileName: string
	fileType: string
	body: Readable
}

export abstract class Uploader {
	abstract uploadAvatar(params: UploadParams): Promise<{ url: string }>
}
