import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/api/get-profile'
import { profileQueryKey } from '../model/identity'
import { useIdentityLifecycle } from './use-end-session'

export function useProfile() {
	const { busy, ended } = useIdentityLifecycle()
	return useQuery({
		queryKey: profileQueryKey,
		queryFn: getProfile,
		retry: false,
		enabled: !busy && !ended,
	})
}
