import { zodResolver } from '@hookform/resolvers/zod'
import { Laptop, Lock, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	FieldTitle,
} from '@/components/ui/field'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'

const passwordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Enter your current password'),
		newPassword: z.string().min(8, 'Use at least 8 characters'),
		confirmPassword: z.string().min(1, 'Confirm your new password'),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	})

type PasswordFormType = z.infer<typeof passwordSchema>

interface ISessionMock {
	id: string
	name: string
	details: string
	device: 'desktop' | 'mobile'
	isCurrent: boolean
}

const SESSION_MOCKS: ISessionMock[] = [
	{
		id: 'current-session',
		name: 'Chrome on Windows',
		details: 'Windows 11 · Active now',
		device: 'desktop',
		isCurrent: true,
	},
	{
		id: 'mobile-session',
		name: 'Chrome on Android',
		details: 'Android · Last active 2 hours ago',
		device: 'mobile',
		isCurrent: false,
	},
]

export function SecuritySettings() {
	const [sessions, setSessions] = useState(SESSION_MOCKS)

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty, isSubmitting },
	} = useForm<PasswordFormType>({
		resolver: zodResolver(passwordSchema),
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		},
	})

	const handlePasswordChange = () => {
		reset()
		toast.success('Password updated')
	}

	const handleSignOut = (sessionId: string) => {
		setSessions((current) => current.filter((session) => session.id !== sessionId))
		toast.success('Session signed out')
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Security</CardTitle>
			</CardHeader>

			<CardContent className="flex flex-col gap-4">
				<form onSubmit={handleSubmit(handlePasswordChange)}>
					<div className="flex flex-col gap-4">
						<FieldSet>
							<FieldGroup className="grid gap-4 md:grid-cols-2">
								<Field
									className="md:col-span-2"
									data-invalid={errors.currentPassword !== undefined}
								>
									<FieldLabel htmlFor="current-password">Current password</FieldLabel>
									<InputGroup>
										<InputGroupAddon>
											<InputGroupText>
												<Lock className="size-3 text-muted-foreground" />
											</InputGroupText>
										</InputGroupAddon>
										<InputGroupInput
											id="current-password"
											type="password"
											autoComplete="current-password"
											aria-invalid={errors.currentPassword !== undefined}
											{...register('currentPassword')}
										/>
									</InputGroup>
									<FieldError errors={[errors.currentPassword]} />
								</Field>

								<Field data-invalid={errors.newPassword !== undefined}>
									<FieldLabel htmlFor="new-password">New password</FieldLabel>
									<InputGroup>
										<InputGroupAddon>
											<InputGroupText>
												<Lock className="size-3 text-muted-foreground" />
											</InputGroupText>
										</InputGroupAddon>
										<InputGroupInput
											id="new-password"
											type="password"
											autoComplete="new-password"
											aria-invalid={errors.newPassword !== undefined}
											{...register('newPassword')}
										/>
									</InputGroup>
									<FieldError errors={[errors.newPassword]} />
								</Field>

								<Field data-invalid={errors.confirmPassword !== undefined}>
									<FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
									<InputGroup>
										<InputGroupAddon>
											<InputGroupText>
												<Lock className="size-3 text-muted-foreground" />
											</InputGroupText>
										</InputGroupAddon>
										<InputGroupInput
											id="confirm-password"
											type="password"
											autoComplete="new-password"
											aria-invalid={errors.confirmPassword !== undefined}
											{...register('confirmPassword')}
										/>
									</InputGroup>
									<FieldError errors={[errors.confirmPassword]} />
								</Field>
							</FieldGroup>
						</FieldSet>

						<Button type="submit" disabled={!isDirty || isSubmitting} className="ml-auto">
							Update password
						</Button>
					</div>
				</form>

				<FieldSeparator />

				<FieldSet>
					<FieldLegend variant="legend">Active sessions</FieldLegend>
					<FieldDescription>Devices that are currently signed in to your account.</FieldDescription>

					<div>
						{sessions.map((session, index) => {
							const DeviceIcon = session.device === 'desktop' ? Laptop : Smartphone

							return (
								<div key={session.id}>
									{index > 0 && <Separator className="my-2" />}

									<Field className="py-2">
										<div className="flex items-center justify-between gap-4">
											<div className="flex min-w-0 items-center gap-3">
												<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
													<DeviceIcon className="size-4 text-muted-foreground" />
												</div>

												<div className="min-w-0">
													<FieldTitle>{session.name}</FieldTitle>
													<FieldDescription>{session.details}</FieldDescription>
												</div>
											</div>

											{session.isCurrent ? (
												<span className="py-1 px-2 text-xs text-indigo-400 font-medium rounded-md bg-indigo-500/20">
													Current
												</span>
											) : (
												<Button
													type="button"
													variant="ghost"
													size="sm"
													aria-label={`Revoke ${session.name}`}
													onClick={() => handleSignOut(session.id)}
												>
													Revoke
												</Button>
											)}
										</div>
									</Field>
								</div>
							)
						})}
					</div>
				</FieldSet>
			</CardContent>
		</Card>
	)
}
