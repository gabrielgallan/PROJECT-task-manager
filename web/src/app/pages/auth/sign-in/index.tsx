import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { HTTPError } from 'ky'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { authenticate } from '@/api/authenticate'
import { BrowserTitle } from '@/components/browser-title'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const signInFormSchema = z.object({
	email: z.email('Provide a valid email address'),
	password: z.string().min(1, 'Provide a valid password'),
})

type SignInFormType = z.infer<typeof signInFormSchema>

export function SignInPage() {
	const [searchParams] = useSearchParams()
	const [error, setError] = useState<string | null>(null)
	const navigate = useNavigate()

	const {
		watch,
		register,
		handleSubmit,
		formState: { isSubmitting, errors },
	} = useForm<SignInFormType>({
		resolver: zodResolver(signInFormSchema),
		defaultValues: {
			email: searchParams.get('email') ?? '',
		},
	})

	const email = watch('email')

	const { mutateAsync: signIn } = useMutation({
		mutationFn: authenticate,
	})

	async function handleSignIn(data: SignInFormType) {
		try {
			await signIn(data)

			navigate('/')
		} catch (error) {
			if (error instanceof HTTPError) {
				setError(error.data.message)
			} else {
				setError('An error occurred')
			}
		}
	}

	return (
		<>
			<BrowserTitle title="Sign In" />
			<form onSubmit={handleSubmit(handleSignIn)}>
				<div className="w-85 flex flex-col justify-center gap-6">
					<div className="space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
					</div>

					{error && (
						<Alert className="bg-rose-400/10 text-rose-500 border-none">
							<AlertTriangle className="size-4" />
							<AlertTitle>Sign In failed!</AlertTitle>
							<AlertDescription>
								<p className="text-rose-500/90">{error}</p>
							</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input id="email" {...register('email')} aria-invalid={errors.email !== undefined} />

						{errors.email && (
							<p className="text-xs font-medium text-rose-500">{errors.email.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="password">Password</Label>

							<Link to={`/auth/forgot-password?email=${email}`}>
								<span className="text-xs text-muted-foreground hover:underline">
									Forgot your password?
								</span>
							</Link>
						</div>

						<Input
							id="password"
							type="password"
							{...register('password')}
							aria-invalid={errors.password !== undefined}
						/>

						{errors.password && (
							<p className="text-xs font-medium text-rose-500">{errors.password.message}</p>
						)}
					</div>

					<Button className="cursor-pointer py-5" type="submit">
						{isSubmitting ? <Loader2 className="animate-spin" /> : 'Login'}
					</Button>

					<Field>
						<FieldSeparator>Or continue with</FieldSeparator>
					</Field>

					<div className="space-y-4 text-center">
						<div className="grid grid-cols-2 gap-2">
							<Button variant="secondary" className="cursor-pointer py-5" type="button">
								<FaGithub className="size-4" />
							</Button>

							<Button variant="secondary" className="cursor-pointer py-5" type="button">
								<FaGoogle className="size-4" />
							</Button>
						</div>

						<Link to="/auth/sign-up" className="font-medium text-sm underline hover:opacity-90">
							Don't have account ?
						</Link>
					</div>
				</div>
			</form>
		</>
	)
}
