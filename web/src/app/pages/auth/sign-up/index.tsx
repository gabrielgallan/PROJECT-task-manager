import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { register as registerAccount } from '@/api/register'
import { BrowserTitle } from '@/components/browser-title'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { authEmailPath } from '@/features/identity/model/identity'
import {
	getHttpStatus,
	getIdentityError,
	getValidationErrors,
} from '@/features/identity/model/identity-errors'
import { type SignUpValues, signUpSchema } from '@/features/identity/model/identity-forms'
import { useOAuthProvider } from '@/hooks/use-oauth-provider'

export function SignUpPage() {
	const navigate = useNavigate()
	const { capture, busy } = useIdentityLifecycle()
	const [error, setError] = useState<string | null>(null)
	const {
		register,
		handleSubmit,
		setError: setFieldError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<SignUpValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: { name: '', email: '', password: '' },
	})

	const { link: githubRedirect } = useOAuthProvider('github')
	const { link: googleRedirect } = useOAuthProvider('google')

	const mutation = useMutation({
		mutationKey: ['identity', 'register'],
		mutationFn: registerAccount,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})
	async function submit(values: SignUpValues) {
		if (mutation.isPending || busy) return
		const current = capture()
		setError(null)
		try {
			await mutation.mutateAsync(values)
			if (!current()) return
			reset()
			navigate(authEmailPath('/auth/sign-in', values.email), { replace: true })
			toast.success('Account created. Sign in to continue.')
		} catch (failure) {
			if (!current()) return
			for (const [field, message] of Object.entries(getValidationErrors(failure))) {
				if (field === 'name' || field === 'email' || field === 'password')
					setFieldError(field, { message })
			}
			if (getHttpStatus(failure) === 409)
				setFieldError(
					'email',
					{ message: getIdentityError(failure, 'register') },
					{ shouldFocus: true },
				)
			else setError(getIdentityError(failure, 'register'))
		}
	}
	return (
		<>
			<BrowserTitle title="Register" />
			<form className="w-full max-w-93 px-4 py-8" onSubmit={handleSubmit(submit)} noValidate>
				<div className="flex flex-col gap-6">
					<h1 className="text-center text-2xl font-semibold tracking-tight">Register</h1>
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					{(
						[
							{ key: 'name', label: 'Name', type: 'text', autocomplete: 'name' },
							{ key: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
							{
								key: 'password',
								label: 'Password',
								type: 'password',
								autocomplete: 'new-password',
							},
						] as const
					).map((field) => (
						<div className="space-y-2" key={field.key}>
							<Label htmlFor={field.key}>{field.label}</Label>
							<Input
								id={field.key}
								type={field.type}
								autoComplete={field.autocomplete}
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
					<Button type="submit" className="py-5" disabled={isSubmitting || busy}>
						{isSubmitting ? <Loader2 className="animate-spin" /> : 'Register'}
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
						Already have an account?{' '}
						<Link to="/auth/sign-in" className="text-muted-foreground underline">
							Sign in
						</Link>
					</p>
				</div>
			</form>
		</>
	)
}
