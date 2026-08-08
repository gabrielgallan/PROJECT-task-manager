import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { BrowserTitle } from '@/components/browser-title'
import { Button } from '@/components/ui/button'
import { Field, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const signInFormSchema = z.object({
	email: z.email('Provide a valid email address'),
	password: z.string(),
})

type SignInFormType = z.infer<typeof signInFormSchema>

export function SignInPage() {
	const [searchParams] = useSearchParams()

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

	function handleSignIn(data: SignInFormType) {
		console.log(data)
	}

	return (
		<>
			<BrowserTitle title="Sign In" />
			<form onSubmit={handleSubmit(handleSignIn)}>
				<div className="w-85 flex flex-col justify-center gap-6">
					<div className="space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
					</div>

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
							<p className="text-xs font-medium text-rose-500">Provide a valid email address</p>
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
