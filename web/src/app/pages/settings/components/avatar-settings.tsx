import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { uploadAvatar } from '@/api/upload-avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import {
	getDisplayName,
	getUserInitials,
	type IdentityProfile,
	profileQueryKey,
} from '@/features/identity/model/identity'
import { getIdentityError } from '@/features/identity/model/identity-errors'
import { avatarMimeTypes, getAvatarError } from '@/features/identity/model/identity-forms'

export function AvatarSettings({ profile }: { profile: IdentityProfile }) {
	const [file, setFile] = useState<File | null>(null)
	const [error, setError] = useState<string | null>(null)
	const input = useRef<HTMLInputElement>(null)
	const { client, capture, revalidateSession, busy } = useEndSession()
	const mutation = useMutation({
		mutationKey: ['identity', 'upload-avatar'],
		mutationFn: uploadAvatar,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	async function upload() {
		if (!file || mutation.isPending || busy) return
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
			setFile(null)
			if (input.current) input.current.value = ''
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
			<Avatar size="lg">
				<AvatarImage src={profile.avatarUrl || undefined} alt={getDisplayName(profile)} />
				<AvatarFallback>{getUserInitials(profile)}</AvatarFallback>
			</Avatar>
			<div className="space-y-2">
				<Label htmlFor="avatar-file">Choose an image</Label>
				<Input
					ref={input}
					id="avatar-file"
					type="file"
					accept={avatarMimeTypes.join(',')}
					disabled={mutation.isPending || busy}
					aria-invalid={!!error}
					aria-describedby="avatar-description avatar-error"
					onChange={(event) => {
						const selected = event.target.files?.[0] ?? null
						setFile(selected)
						setError(selected ? getAvatarError(selected) : null)
					}}
				/>
				<p id="avatar-description" className="text-sm text-muted-foreground">
					JPEG, PNG, WebP or HEIC. Smaller than 5 MB.
				</p>
				{file && <p className="break-all text-sm">{file.name}</p>}
				<div id="avatar-error">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
				</div>
			</div>
			<Button
				disabled={!file || !!(file && getAvatarError(file)) || mutation.isPending || busy}
				onClick={() => void upload()}
			>
				{mutation.isPending ? 'Uploading…' : 'Upload photo'}
			</Button>
		</section>
	)
}
