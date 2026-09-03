import { z } from 'zod'
import type { editProfile } from '@/api/edit-profile'
import type { IdentityProfile } from './identity'

const email = z.email('Enter a valid email address')
const newPassword = z
	.string()
	.min(6, 'Use at least 6 characters')
	.max(18, 'Use at most 18 characters')

export const signInSchema = z.object({
	email,
	password: z.string().min(6, 'Use at least 6 characters'),
})
export const signUpSchema = z.object({
	name: z.string().trim().min(1, 'Enter your name'),
	email,
	password: newPassword,
})
export const recoverySchema = z.object({ email })
export const resetPasswordSchema = z
	.object({ password: newPassword, confirmPassword: z.string() })
	.refine((values) => values.password === values.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	})
export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Enter your current password'),
		newPassword,
		confirmPassword: z.string(),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	})
export const profileSchema = z.object({ name: z.string(), jobTitle: z.string() })
export const recoveryTokenSchema = z.uuid()

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type RecoveryValues = z.infer<typeof recoverySchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
export type ProfileValues = z.infer<typeof profileSchema>

export function profileFormValues(profile: IdentityProfile): ProfileValues {
	return { name: profile.name ?? '', jobTitle: profile.jobTitle ?? '' }
}

export function getProfileChanges(values: ProfileValues, original: ProfileValues) {
	const changes: Parameters<typeof editProfile>[0] = {}
	for (const field of ['name', 'jobTitle'] as const) {
		const value = values[field].trim() || null
		if (value !== (original[field].trim() || null)) changes[field] = value
	}
	return changes
}

export const avatarMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export function getAvatarError(file: File) {
	if (!avatarMimeTypes.includes(file.type)) return 'Choose a JPEG, PNG, WebP or HEIC image.'
	if (file.size === 0) return 'Choose a non-empty image.'
	if (file.size >= 5_000_000) return 'Choose an image smaller than 5 MB.'
	return null
}
