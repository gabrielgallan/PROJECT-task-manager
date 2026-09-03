import { api } from '@/lib/ky'

interface UploadAvatarRequest {
	file: File
}

export async function uploadAvatar({ file }: UploadAvatarRequest): Promise<void> {
	const formData = new FormData()
	formData.append('file', file)

	await api.put('api/profile/avatar', {
		body: formData,
	})
}
