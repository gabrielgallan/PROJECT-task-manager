import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import z from 'zod'
import { BrowserTitle } from '@/components/browser-title'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const forgotPasswordFormSchema = z.object({
	email: z.email('Provide a valid email address'),
})

type ForgotPasswordFormType = z.infer<typeof forgotPasswordFormSchema>

export function ForgotPasswordPage() {
	const [searchParams] = useSearchParams()

	const email = searchParams.get('email') ?? ''

	const {
		register,
		handleSubmit,
		formState: { isSubmitting, errors },
	} = useForm<ForgotPasswordFormType>({
		resolver: zodResolver(forgotPasswordFormSchema),
		defaultValues: {
			email,
		},
	})

	async function handleRequestPasswordRecover(data: ForgotPasswordFormType) {
		console.log(data)
	}

	return (
		<>
			<BrowserTitle title="Forgot your password" />
			<form onSubmit={handleSubmit(handleRequestPasswordRecover)}>
				<div className="w-85 flex flex-col items-center gap-6">
					<div className="space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight">Send a code to your email</h1>
					</div>

					<div className="space-y-2 w-full">
						<Label htmlFor="email">Email</Label>

						<Input
							id="email"
							type="text"
							{...register('email')}
							aria-invalid={errors.email !== undefined}
						/>

						{errors.email && (
							<p className="text-xs font-medium text-rose-500">{errors.email.message}</p>
						)}
					</div>

					<Button className="py-5 w-full" type="submit">
						{isSubmitting ? <Loader2 className="animate-spin" /> : 'Send'}
					</Button>

					<Link to="/auth/sign-in" className="font-medium text-sm underline hover:opacity-90">
						Sign in instead
					</Link>
				</div>
			</form>
		</>
	)
}
