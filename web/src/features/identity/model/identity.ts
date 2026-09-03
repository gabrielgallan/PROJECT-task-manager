import { format } from 'date-fns/format'
import type { fetchSessions } from '@/api/fetch-sessions'
import type { getProfile } from '@/api/get-profile'

export type IdentityProfile = Awaited<ReturnType<typeof getProfile>>['profile']
export type IdentitySession = Awaited<ReturnType<typeof fetchSessions>>['sessions'][number]

export const profileQueryKey = ['user:profile'] as const
export const sessionsQueryKey = ['user:sessions'] as const

export function getDisplayName(profile: IdentityProfile) {
	return profile.name?.trim() || profile.email
}

export function getUserInitials(profile: IdentityProfile) {
	const names = profile.name?.trim().split(/\s+/)
	if (!names?.[0]) return profile.email.charAt(0).toUpperCase()
	return `${names[0][0]}${names.length > 1 ? names[names.length - 1][0] : ''}`.toUpperCase()
}

export function getSessionLabel(session: IdentitySession) {
	const browser = session.userAgent?.browserName
	const os = session.userAgent?.osName
	return browser && os ? `${browser} on ${os}` : browser || os || 'Unknown device'
}

export function getSessionDetails(session: IdentitySession) {
	const date = new Date(session.createdAt)

	const created = Number.isNaN(date.getTime())
		? 'Unknown sign-in date'
		: `since ${format(date, 'MMM d, yyyy h:mm a')}`
	return [
		[session.userAgent?.osName, session.userAgent?.osVersion].filter(Boolean).join(' '),
		session.ipAddress,
		created,
	]
		.filter(Boolean)
		.join(' · ')
}

export function authEmailPath(path: string, email: string) {
	return `${path}?${new URLSearchParams({ email })}`
}
