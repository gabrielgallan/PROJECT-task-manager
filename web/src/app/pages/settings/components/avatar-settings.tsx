import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { uploadAvatar } from '@/api/upload-avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import {
	getDisplayName,
	getUserInitials,
	type IdentityProfile,
	profileQueryKey,
} from '@/features/identity/model/identity'
import { getIdentityError } from '@/features/identity/model/identity-errors'
import { avatarMimeTypes, getAvatarError } from '@/features/identity/model/identity-forms'
import { AvatarUpload } from './avatar-upload'

export function AvatarSettings({ profile }: { profile: IdentityProfile }) {
	const [error, setError] = useState<string | null>(null)
	const { client, capture, revalidateSession, busy } = useEndSession()
	const mutation = useMutation({
		mutationKey: ['identity', 'upload-avatar'],
		mutationFn: uploadAvatar,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	async function upload(file: File) {
		if (mutation.isPending || busy) return
		const invalid = getAvatarError(file)
		if (invalid) {
			setError(invalid)
			return
		}
		const current = capture()
		setError(null)
		try {
			await mutation.mutateAsync({ file })
			if (!current()) return
			toast.success('Photo uploaded')
			void client.invalidateQueries({ queryKey: profileQueryKey })
		} catch (failure) {
			if (current() && !(await revalidateSession(failure)) && current())
				setError(getIdentityError(failure, 'avatar'))
		}
	}
	return (
		<section className="space-y-3" aria-labelledby="avatar-heading">
			<h2 id="avatar-heading" className="font-medium">
				Profile photo
			</h2>
			<AvatarUpload
				src={profile.avatarUrl}
				alt={getDisplayName(profile)}
				initials={getUserInitials(profile)}
				accept={avatarMimeTypes.join(',')}
				pending={mutation.isPending}
				disabled={busy}
				aria-invalid={!!error}
				aria-describedby="avatar-description avatar-error"
				onSelect={(file) => void upload(file)}
			/>
			<p id="avatar-description" className="text-sm text-muted-foreground">
				JPEG, PNG, WebP or HEIC. Smaller than 5 MB.
			</p>
			<div id="avatar-error">
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</div>
		</section>
	)
}
