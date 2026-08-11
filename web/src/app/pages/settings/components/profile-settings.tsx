import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'

const PROFILE_MOCK = {
	name: 'Gabriel Gallan',
	email: 'gabriel31.gal@gmail.com',
	username: 'gabrielgallan',
	avatarUrl: 'https://github.com/gabrielgallan.png',
}

const userProfileSchema = z.object({
	name: z.string().trim().min(1, 'Enter a display name'),
	username: z.string().trim().min(1, 'Enter a username'),
})

type UserProfileType = z.infer<typeof userProfileSchema>

export function ProfileSettings() {
	const [profile, setProfile] = useState(PROFILE_MOCK)

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty, isSubmitting },
	} = useForm<UserProfileType>({
		resolver: zodResolver(userProfileSchema),
		defaultValues: {
			name: PROFILE_MOCK.name,
			username: PROFILE_MOCK.username,
		},
	})

	const handleSave = (values: UserProfileType) => {
		const nextProfile = { ...profile, ...values }

		setProfile(nextProfile)

		reset(values)

		toast.success('Profile updated')
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Profile</CardTitle>
			</CardHeader>

			<CardContent className="space-y-5">
				<form id="profile-settings-form" onSubmit={handleSubmit(handleSave)}>
					<div className="flex flex-col gap-4">
						<FieldGroup className="grid gap-4 md:grid-cols-2">
							<Field data-invalid={errors.name !== undefined}>
								<FieldLabel htmlFor="profile-name">Display Name</FieldLabel>
								<Input
									id="profile-name"
									aria-invalid={errors.name !== undefined}
									{...register('name')}
								/>
								<FieldError errors={[errors.name]} />
							</Field>

							<Field data-invalid={errors.username !== undefined}>
								<FieldLabel htmlFor="profile-email">Username</FieldLabel>
								<InputGroup>
									<InputGroupAddon>
										<InputGroupText>@</InputGroupText>
									</InputGroupAddon>
									<InputGroupInput
										id="profile-username"
										type="text"
										aria-invalid={errors.username !== undefined}
										{...register('username')}
									/>
								</InputGroup>
								<FieldError errors={[errors.username]} />
							</Field>
						</FieldGroup>

						<Button type="submit" disabled={!isDirty || isSubmitting} className="ml-auto">
							Save
						</Button>
					</div>
				</form>

				<Separator />

				<form>
					<div className="flex flex-col gap-2">
						<FieldSet>
							<FieldLegend>Change Password</FieldLegend>

							<FieldGroup className="grid gap-4 md:grid-cols-2">
								<Field>
									<FieldLabel htmlFor="current-password">Current password</FieldLabel>
									<InputGroup>
										<InputGroupAddon>
											<InputGroupText>
												<Lock className="size-3 text-muted-foreground" />
											</InputGroupText>
										</InputGroupAddon>
										<InputGroupInput id="current-password" type="password" />
									</InputGroup>
								</Field>

								<Field>
									<FieldLabel>New password</FieldLabel>
									<InputGroup>
										<InputGroupAddon>
											<InputGroupText>
												<Lock className="size-3 text-muted-foreground" />
											</InputGroupText>
										</InputGroupAddon>
										<InputGroupInput id="new-password" type="password" />
									</InputGroup>
								</Field>
							</FieldGroup>
						</FieldSet>

						<Button type="submit" className="ml-auto">
							Save
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
