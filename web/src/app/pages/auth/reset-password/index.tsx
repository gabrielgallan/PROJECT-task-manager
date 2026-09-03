import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { resetPassword } from '@/api/reset-password'
import { BrowserTitle } from '@/components/browser-title'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import {
	getHttpStatus,
	getIdentityError,
	getValidationErrors,
} from '@/features/identity/model/identity-errors'
import {
	type ResetPasswordValues,
	recoveryTokenSchema,
	resetPasswordSchema,
} from '@/features/identity/model/identity-forms'

export function ResetPasswordPage() {
	const [params] = useSearchParams()
	const code = params.get('code')
	const validToken = recoveryTokenSchema.safeParse(code).success
	const [rejectedCode, setRejectedCode] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const navigate = useNavigate()
	const { capture, busy } = useIdentityLifecycle()
	const {
		register,
		handleSubmit,
		reset,
		setError: setFieldError,
		formState: { errors, isSubmitting },
	} = useForm<ResetPasswordValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { password: '', confirmPassword: '' },
	})
	const mutation = useMutation({
		mutationKey: ['identity', 'reset-password'],
		mutationFn: resetPassword,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	async function submit(values: ResetPasswordValues) {
		if (!code || !validToken || mutation.isPending || busy) return
		const current = capture()
		setError(null)
		try {
			await mutation.mutateAsync({ tokenId: code, password: values.password })
			if (!current()) return
			reset()
			navigate('/auth/sign-in', { replace: true })
			toast.success('Password updated. Sign in to continue.')
		} catch (failure) {
			if (!current()) return
			const fields = getValidationErrors(failure)
			if (fields.password)
				setFieldError('password', { message: fields.password }, { shouldFocus: true })
			else if (getHttpStatus(failure) === 400 || getHttpStatus(failure) === 404)
				setRejectedCode(code)
			setError(getIdentityError(failure, fields.password ? 'profile' : 'reset'))
		}
	}
	const unavailable = !validToken || rejectedCode === code
	return (
		<>
			<BrowserTitle title="Choose a new password" />
			<div className="flex w-full max-w-93 flex-col gap-6 px-4 py-8">
				<h1 className="text-center text-2xl font-semibold tracking-tight">Choose a new password</h1>
				{unavailable ? (
					<Alert variant="destructive">
						<AlertDescription>
							This recovery link is invalid or no longer available. Request a new link.
						</AlertDescription>
					</Alert>
				) : (
					<>
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<form className="space-y-6" onSubmit={handleSubmit(submit)} noValidate>
							{(
								[
									{ key: 'password', label: 'New password' },
									{ key: 'confirmPassword', label: 'Confirm password' },
								] as const
							).map((field) => (
								<div className="space-y-2" key={field.key}>
									<Label htmlFor={field.key}>{field.label}</Label>
									<Input
										id={field.key}
										type="password"
										autoComplete="new-password"
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
							<p className="text-sm text-muted-foreground">Use 6–18 characters.</p>
							<Button className="w-full" type="submit" disabled={isSubmitting || busy}>
								{isSubmitting ? 'Updating…' : 'Reset password'}
							</Button>
						</form>
					</>
				)}
				<Link className="text-center text-sm underline" to="/auth/forgot-password">
					Request a new recovery link
				</Link>
				<Link className="text-center text-sm underline" to="/auth/sign-in">
					Back to sign in
				</Link>
			</div>
		</>
	)
}
