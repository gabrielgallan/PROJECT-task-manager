import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { Link, useSearchParams } from 'react-router-dom'
import { authenticate } from '@/api/authenticate'
import { BrowserTitle } from '@/components/browser-title'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import { authEmailPath } from '@/features/identity/model/identity'
import { getIdentityError, getValidationErrors } from '@/features/identity/model/identity-errors'
import { type SignInValues, signInSchema } from '@/features/identity/model/identity-forms'
import { useOAuthProvider } from '@/hooks/use-oauth-provider'

export function SignInPage() {
	const [params] = useSearchParams()
	const [error, setError] = useState<string | null>(null)
	const { afterSignIn, capture, busy } = useEndSession()
	const {
		register,
		handleSubmit,
		watch,
		setError: setFieldError,
		formState: { errors, isSubmitting },
	} = useForm<SignInValues>({
		resolver: zodResolver(signInSchema),
		defaultValues: { email: params.get('email') ?? '', password: '' },
	})

	const { link: githubRedirect } = useOAuthProvider('github')
	const { link: googleRedirect } = useOAuthProvider('google')

	const mutation = useMutation({
		mutationKey: ['identity', 'login'],
		mutationFn: authenticate,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})

	async function submit(values: SignInValues) {
		if (mutation.isPending || busy) return
		const current = capture()
		setError(null)
		try {
			await mutation.mutateAsync(values)
			if (current()) await afterSignIn()
		} catch (failure) {
			if (!current()) return
			for (const [field, message] of Object.entries(getValidationErrors(failure))) {
				if (field === 'email' || field === 'password') setFieldError(field, { message })
			}
			setError(getIdentityError(failure, 'login'))
		}
	}
	return (
		<>
			<BrowserTitle title="Sign In" />
			<form className="w-full max-w-93 px-4 py-8" onSubmit={handleSubmit(submit)} noValidate>
				<div className="flex flex-col gap-6">
					<h1 className="text-center text-2xl font-semibold tracking-tight">Sign In</h1>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
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
					<div className="space-y-2">
						<div className="flex items-center justify-between gap-2">
							<Label htmlFor="password">Password</Label>
							<Link
								className="text-xs hover:underline text-muted-foreground"
								to={authEmailPath('/auth/forgot-password', watch('email'))}
							>
								Forgot password?
							</Link>
						</div>
						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							{...register('password')}
							aria-invalid={!!errors.password}
							aria-describedby={errors.password ? 'password-error' : undefined}
						/>
						{errors.password && (
							<p id="password-error" className="text-sm text-destructive">
								{errors.password.message}
							</p>
						)}
					</div>
					<Button type="submit" className="py-5" disabled={isSubmitting || busy}>
						{isSubmitting || busy ? <Loader2 className="animate-spin" /> : 'Login'}
					</Button>

					<FieldSeparator>Or continue with</FieldSeparator>

					<div className="grid grid-cols-2 gap-2">
						<Button
							onClick={() => {
								window.location.href = githubRedirect.href
							}}
							variant="secondary"
							className="py-5"
							type="button"
							disabled={isSubmitting}
						>
							<FaGithub className="size-4" />
						</Button>

						<Button
							onClick={() => {
								window.location.href = googleRedirect.href
							}}
							variant="secondary"
							className="py-5"
							type="button"
							disabled={isSubmitting}
						>
							<FaGoogle className="size-4" />
						</Button>
					</div>
					<p className="text-center text-sm">
						Don't have an account?{' '}
						<Link className="text-muted-foreground underline" to="/auth/sign-up">
							Sign up
						</Link>
					</p>
				</div>
			</form>
		</>
	)
}
