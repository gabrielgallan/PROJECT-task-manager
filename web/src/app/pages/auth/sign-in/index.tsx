import { FaGithub, FaGoogle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { BrowserTitle } from '@/components/browser-title'
import { Button } from '@/components/ui/button'
import { Field, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignInPage() {
	return (
		<>
			<BrowserTitle title="Sign In" />
			<div className="w-85 flex flex-col justify-center gap-6">
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input id="email" type="email" />
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="password">Password</Label>

						<Link to="/auth/forgot-password">
							<span className="text-xs text-muted-foreground hover:underline">
								Forgot your password?
							</span>
						</Link>
					</div>

					<Input id="password" type="password" />
				</div>

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
		</>
	)
}
