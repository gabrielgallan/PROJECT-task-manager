import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { requestPasswordRecover } from '@/api/request-password-recover'
import { BrowserTitle } from '@/components/browser-title'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { authEmailPath } from '@/features/identity/model/identity'
import { getIdentityError } from '@/features/identity/model/identity-errors'
import { type RecoveryValues, recoverySchema } from '@/features/identity/model/identity-forms'

export function ForgotPasswordPage() {
	const [params] = useSearchParams()
	const { capture, busy } = useIdentityLifecycle()
	const [sentEmail, setSentEmail] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<RecoveryValues>({
		resolver: zodResolver(recoverySchema),
		defaultValues: { email: params.get('email') ?? '' },
	})
	const mutation = useMutation({
		mutationKey: ['identity', 'recovery'],
		mutationFn: requestPasswordRecover,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	async function submit(values: RecoveryValues) {
		if (mutation.isPending || busy) return
		const current = capture()
		setError(null)
		try {
			await mutation.mutateAsync(values)
			if (current()) setSentEmail(values.email)
		} catch (failure) {
			if (current()) setError(getIdentityError(failure, 'recovery'))
		}
	}
	const pending = isSubmitting || mutation.isPending || busy
	return (
		<>
			<BrowserTitle title="Reset your password" />
			<div className="flex w-full max-w-93 flex-col gap-6 px-4 py-8">
				<h1 className="text-center text-2xl font-semibold tracking-tight">Reset your password</h1>
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				{sentEmail ? (
					<>
						<p role="status" className="wrap-break-word text-sm">
							A recovery link was sent to <strong>{sentEmail}</strong>. Check your inbox.
						</p>
						<Button disabled={pending} onClick={() => void submit({ email: sentEmail })}>
							{pending ? 'Sending…' : 'Resend link'}
						</Button>
						<Button
							variant="outline"
							disabled={pending}
							onClick={() => {
								setSentEmail(null)
								setError(null)
							}}
						>
							Use another email
						</Button>
					</>
				) : (
					<form className="space-y-6" onSubmit={handleSubmit(submit)} noValidate>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								{...register('email')}
								aria-invalid={!!errors.email}
								aria-describedby={errors.email ? 'email-error' : undefined}
							/>
							{errors.email && (
								<p id="email-error" className="text-sm text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>
						<Button className="w-full" type="submit" disabled={pending}>
							{pending ? 'Sending…' : 'Send recovery link'}
						</Button>
					</form>
				)}
				<Link
					className="text-center text-sm underline"
					to={authEmailPath('/auth/sign-in', sentEmail ?? watch('email'))}
				>
					Sign in instead
				</Link>
			</div>
		</>
	)
}
