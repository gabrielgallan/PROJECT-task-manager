import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import type { IUserProfileSettings } from '@/app/pages/settings/model/profile-settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const userProfileSchema = z.object({
	name: z.string().trim().min(1, 'Enter a display name'),
	email: z.email('Enter a valid email address'),
	username: z.string().trim().min(1, 'Enter a username'),
	jobTitle: z.string().trim().max(60, 'Keep the job title under 60 characters'),
})

type UserProfileType = z.infer<typeof userProfileSchema>

interface AccountSettingsProps {
	profile: IUserProfileSettings
	onProfileChange: (profile: IUserProfileSettings) => void
}

export function AccountSettings({ profile, onProfileChange }: AccountSettingsProps) {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty, isSubmitting },
	} = useForm<UserProfileType>({
		resolver: zodResolver(userProfileSchema),
		defaultValues: {
			name: profile.name,
			email: profile.email,
			username: profile.username,
			jobTitle: profile.jobTitle,
		},
	})

	const handleSave = (values: UserProfileType) => {
		const nextProfile = { ...profile, ...values }

		onProfileChange(nextProfile)

		reset(values)

		toast.success('Profile updated')
	}

	return (
		<Card className="bg-transparent ring-transparent">
			<CardHeader>
				<CardTitle className="text-lg">Account</CardTitle>
			</CardHeader>

			<CardContent className="space-y-4">
				<form id="profile-settings-form" onSubmit={handleSubmit(handleSave)}>
					<div className="flex flex-col gap-4">
						<FieldSet>
							<FieldLegend variant="legend">Profile</FieldLegend>
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

								<Field data-invalid={errors.jobTitle !== undefined}>
									<FieldLabel htmlFor="profile-job-title">Job title</FieldLabel>
									<Input
										id="profile-job-title"
										placeholder="e.g. Developer"
										aria-invalid={errors.jobTitle !== undefined}
										{...register('jobTitle')}
									/>
									<FieldError errors={[errors.jobTitle]} />
								</Field>

								<Field data-invalid={errors.email !== undefined}>
									<FieldLabel htmlFor="profile-email">Email</FieldLabel>
									<Input
										id="profile-email"
										type="email"
										aria-invalid={errors.email !== undefined}
										{...register('email')}
									/>
									<FieldError errors={[errors.email]} />
								</Field>
							</FieldGroup>
						</FieldSet>

						<Button type="submit" disabled={!isDirty || isSubmitting} className="ml-auto">
							Save
						</Button>
					</div>
				</form>

				<Separator />

				<FieldSet>
					<FieldLegend variant="legend">Danger zone</FieldLegend>
					<FieldDescription>Irreversible account actions</FieldDescription>

					<FieldGroup>
						<Field>
							<div className="flex items-center justify-between">
								<div>
									<FieldLabel>Delete account</FieldLabel>
									<FieldDescription>Permanently remove your account and all data</FieldDescription>
								</div>

								<Button variant="destructive">
									<Trash2 />
									Delete
								</Button>
							</div>
						</Field>
					</FieldGroup>
				</FieldSet>
			</CardContent>
		</Card>
	)
}
