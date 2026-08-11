import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const PROFILE_MOCK = {
	name: 'Gabriel Gallan',
	email: 'gabriel31.gal@gmail.com',
	githubUsername: 'gabrielgallan',
	avatarUrl: 'https://github.com/gabrielgallan.png',
}

const profileSchema = z.object({
	name: z.string().trim().min(1, 'Enter a display name'),
	email: z.email('Enter a valid email address'),
})

type TProfileForm = z.infer<typeof profileSchema>

type IProfileSettingsProps = {}

export function ProfileSettings({}: IProfileSettingsProps) {
	const [profile, setProfile] = useState(PROFILE_MOCK)
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty, isSubmitting },
	} = useForm<TProfileForm>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			name: PROFILE_MOCK.name,
			email: PROFILE_MOCK.email,
		},
	})

	const handleSave = (values: TProfileForm) => {
		const nextProfile = { ...profile, ...values }

		setProfile(nextProfile)
		reset(values)
		toast.success('Profile updated')
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
			</CardHeader>

			<CardContent className="space-y-5">
				<div className="flex min-w-0 items-center gap-4">
					<Avatar className="size-16">
						<AvatarImage src={profile.avatarUrl} alt={profile.githubUsername} />
						<AvatarFallback className="text-base">GG</AvatarFallback>
					</Avatar>

					<div className="min-w-0">
						<p className="truncate text-base font-medium">{profile.name}</p>
						<p className="truncate text-sm text-muted-foreground">@{profile.githubUsername}</p>
						<p className="truncate text-xs text-muted-foreground">{profile.email}</p>
					</div>
				</div>

				<Separator />

				<form id="profile-settings-form" noValidate onSubmit={handleSubmit(handleSave)}>
					<FieldGroup className="grid gap-4 sm:grid-cols-2">
						<Field data-invalid={errors.name !== undefined}>
							<FieldLabel htmlFor="profile-name">Display name</FieldLabel>
							<Input
								id="profile-name"
								autoComplete="name"
								aria-invalid={errors.name !== undefined}
								{...register('name')}
							/>
							<FieldError errors={[errors.name]} />
						</Field>

						<Field data-invalid={errors.email !== undefined}>
							<FieldLabel htmlFor="profile-email">Email</FieldLabel>
							<Input
								id="profile-email"
								type="email"
								autoComplete="email"
								aria-invalid={errors.email !== undefined}
								{...register('email')}
							/>
							<FieldDescription>Used for account communication and sign-in.</FieldDescription>
							<FieldError errors={[errors.email]} />
						</Field>
					</FieldGroup>
				</form>
			</CardContent>

			<CardFooter className="justify-end bg-transparent">
				<Button type="submit" form="profile-settings-form" disabled={!isDirty || isSubmitting}>
					Save changes
				</Button>
			</CardFooter>
		</Card>
	)
}
