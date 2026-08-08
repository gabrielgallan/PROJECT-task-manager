import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import z from 'zod'
import { BrowserTitle } from '@/components/browser-title'
import { Button } from '@/components/ui/button'
import { Field, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const signUpFormSchema = z.object({
	name: z.string().optional(),
	email: z.email('Provide a valid email address'),
	password: z.string().min(6, 'Password must have 6 charaters'),
})

type SignUpFormType = z.infer<typeof signUpFormSchema>

export function SignUpPage() {
	const {
		register,
		handleSubmit,
		formState: { isSubmitting, errors },
	} = useForm<SignUpFormType>({
		resolver: zodResolver(signUpFormSchema),
	})

	function handleSignUp(data: SignUpFormType) {
		console.log(data)
	}

	return (
		<>
			<BrowserTitle title="Register" />
			<form onSubmit={handleSubmit(handleSignUp)}>
				<div className="w-85 flex flex-col justify-center gap-6">
					<div className="space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight">Register</h1>
					</div>

					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>

						<Input
							id="name"
							type="text"
							{...register('name')}
							aria-invalid={errors.name !== undefined}
						/>

						{errors.name && (
							<p className="text-xs font-medium text-rose-500">{errors.name.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>

						<Input
							id="email"
							type="email"
							{...register('email')}
							aria-invalid={errors.email !== undefined}
						/>

						{errors.email && (
							<p className="text-xs font-medium text-rose-500">{errors.email.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>

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

					<Button className="py-5" type="submit">
						{isSubmitting ? <Loader2 className="animate-spin" /> : 'Register'}
					</Button>

					<Field>
						<FieldSeparator>Or</FieldSeparator>
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

						<Link to="/auth/sign-in" className="font-medium text-sm underline hover:opacity-90">
							Already have an account ?
						</Link>
					</div>
				</div>
			</form>
		</>
	)
}
