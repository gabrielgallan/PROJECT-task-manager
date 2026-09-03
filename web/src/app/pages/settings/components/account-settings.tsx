import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { editProfile } from '@/api/edit-profile'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import { type IdentityProfile, profileQueryKey } from '@/features/identity/model/identity'
import { getIdentityError, getValidationErrors } from '@/features/identity/model/identity-errors'
import {
	getProfileChanges,
	type ProfileValues,
	profileFormValues,
	profileSchema,
} from '@/features/identity/model/identity-forms'
import { AvatarSettings } from './avatar-settings'
import { DeleteAccountDialog } from './delete-account-dialog'

export function AccountSettings({ profile }: { profile: IdentityProfile }) {
	const { client, capture, revalidateSession, busy } = useEndSession()
	const original = useRef(profileFormValues(profile))
	const [error, setError] = useState<string | null>(null)
	const {
		register,
		handleSubmit,
		reset,
		watch,
		setError: setFieldError,
		formState: { errors, isDirty, isSubmitting },
	} = useForm<ProfileValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: original.current,
	})
	const mutation = useMutation({
		mutationKey: ['identity', 'edit-profile'],
		mutationFn: editProfile,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	useEffect(() => {
		if (isDirty || isSubmitting) return
		const values = { name: profile.name ?? '', jobTitle: profile.jobTitle ?? '' }
		original.current = values
		reset(values)
	}, [profile.name, profile.jobTitle, isDirty, isSubmitting, reset])
	const hasChanges = Object.keys(getProfileChanges(watch(), original.current)).length > 0
	async function submit(values: ProfileValues) {
		const changes = getProfileChanges(values, original.current)
		if (!Object.keys(changes).length || mutation.isPending || busy) return
		const current = capture()
		setError(null)
		try {
			await mutation.mutateAsync(changes)
			if (!current()) return
			await client.cancelQueries({ queryKey: profileQueryKey, exact: true })
			if (!current()) return
			client.setQueryData<{ profile: IdentityProfile }>(profileQueryKey, (previous) =>
				previous ? { profile: { ...previous.profile, ...changes } } : previous,
			)
			const saved = { name: values.name.trim(), jobTitle: values.jobTitle.trim() }
			original.current = saved
			reset(saved)
			toast.success('Profile updated')
			void client.invalidateQueries({ queryKey: profileQueryKey })
		} catch (failure) {
			if (!current() || (await revalidateSession(failure)) || !current()) return
			for (const [field, message] of Object.entries(getValidationErrors(failure))) {
				if (field === 'name' || field === 'jobTitle') setFieldError(field, { message })
			}
			setError(getIdentityError(failure, 'profile'))
		}
	}
	return (
		<Card className="bg-transparent ring-transparent">
			<CardHeader>
				<CardTitle className="text-lg">Account</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<AvatarSettings profile={profile} />
				<Separator />
				<form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
					<h2 className="font-medium">Profile</h2>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<fieldset disabled={isSubmitting || busy} className="grid gap-4 md:grid-cols-2">
						{(
							[
								{ key: 'name', label: 'Display name' },
								{ key: 'jobTitle', label: 'Job title' },
							] as const
						).map((field) => (
							<div className="space-y-2" key={field.key}>
								<Label htmlFor={`profile-${field.key}`}>{field.label}</Label>
								<Input
									id={`profile-${field.key}`}
									{...register(field.key)}
									aria-invalid={!!errors[field.key]}
									aria-describedby={errors[field.key] ? `${field.key}-error` : undefined}
								/>
								{errors[field.key] && (
									<p id={`${field.key}-error`} className="text-sm text-destructive">
										{errors[field.key]?.message}
									</p>
								)}
							</div>
						))}
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="profile-email">Email</Label>
							<Input
								id="profile-email"
								type="email"
								value={profile.email}
								readOnly
								aria-describedby="email-description"
							/>
							<p id="email-description" className="text-sm text-muted-foreground">
								Your email cannot be changed here.
							</p>
						</div>
					</fieldset>
					<div className="flex justify-end">
						<Button type="submit" disabled={!hasChanges || isSubmitting || busy}>
							{isSubmitting ? 'Saving…' : 'Save'}
						</Button>
					</div>
				</form>
				<Separator />
				<div className="space-y-3">
					<h2 className="font-medium">Danger zone</h2>
					<p className="text-sm text-muted-foreground">
						Permanently delete your account and its data stored on the server.
					</p>
					<DeleteAccountDialog email={profile.email} />
				</div>
			</CardContent>
		</Card>
	)
}
