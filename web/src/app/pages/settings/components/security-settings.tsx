import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { changePassword } from '@/api/change-password'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import { authEmailPath, type IdentityProfile } from '@/features/identity/model/identity'
import {
	getHttpStatus,
	getIdentityError,
	getValidationErrors,
} from '@/features/identity/model/identity-errors'
import {
	type ChangePasswordValues,
	changePasswordSchema,
} from '@/features/identity/model/identity-forms'
import { ActiveSessions } from './active-sessions'

export function SecuritySettings({
	profile,
	active,
}: {
	profile: IdentityProfile
	active: boolean
}) {
	const { capture, revalidateSession, busy } = useEndSession()
	const [error, setError] = useState<string | null>(null)
	const {
		register,
		handleSubmit,
		reset,
		setError: setFieldError,
		formState: { errors, isDirty, isSubmitting },
	} = useForm<ChangePasswordValues>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
	})
	const mutation = useMutation({
		mutationKey: ['identity', 'change-password'],
		mutationFn: changePassword,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	async function submit({ currentPassword, newPassword }: ChangePasswordValues) {
		if (mutation.isPending || busy) return
		const current = capture()
		setError(null)
		try {
			await mutation.mutateAsync({ currentPassword, newPassword })
			if (!current()) return
			reset()
			toast.success('Password updated')
		} catch (failure) {
			if (!current() || (await revalidateSession(failure)) || !current()) return
			const fields = getValidationErrors(failure)
			for (const [field, message] of Object.entries(fields)) {
				if (field === 'currentPassword' || field === 'newPassword')
					setFieldError(field, { message })
			}
			if (getHttpStatus(failure) === 400 && !Object.keys(fields).length)
				setFieldError(
					'currentPassword',
					{ message: getIdentityError(failure, 'password') },
					{ shouldFocus: true },
				)
			else setError(getIdentityError(failure, Object.keys(fields).length ? 'profile' : 'password'))
		}
	}
	return (
		<Card className="bg-transparent ring-transparent">
			<CardHeader>
				<CardTitle className="text-lg">Security</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
					<h2 className="font-medium">Change password</h2>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<fieldset disabled={isSubmitting || busy} className="grid gap-4 md:grid-cols-2">
						{(
							[
								{ key: 'currentPassword', label: 'Current password' },
								{ key: 'newPassword', label: 'New password' },
								{ key: 'confirmPassword', label: 'Confirm password' },
							] as const
						).map((field) => (
							<div
								className={`space-y-2 ${field.key === 'currentPassword' ? 'md:col-span-2' : ''}`}
								key={field.key}
							>
								<Label htmlFor={field.key}>{field.label}</Label>
								<Input
									id={field.key}
									type="password"
									autoComplete={
										field.key === 'currentPassword' ? 'current-password' : 'new-password'
									}
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
					</fieldset>
					<p className="text-sm text-muted-foreground">
						Use 6–18 characters for your new password.
					</p>
					<Link
						className="block text-sm underline"
						to={authEmailPath('/auth/forgot-password', profile.email)}
					>
						Forgot or haven't set a password? Send a recovery link
					</Link>
					<div className="flex justify-end">
						<Button type="submit" disabled={!isDirty || isSubmitting || busy}>
							{isSubmitting ? 'Updating…' : 'Update password'}
						</Button>
					</div>
				</form>
				<Separator />
				<ActiveSessions active={active} />
			</CardContent>
		</Card>
	)
}
