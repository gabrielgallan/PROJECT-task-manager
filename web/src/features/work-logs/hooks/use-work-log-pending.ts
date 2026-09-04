import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { workLogRuntimeFor } from '../model/work-log-runtime'

export function useWorkLogPending(id?: string) {
	const client = useQueryClient()
	const { generation, busy, ended } = useIdentityLifecycle()
	const runtime = workLogRuntimeFor(client)
	const subscribe = useCallback(
		(listener: () => void) => {
			runtime.listeners.add(listener)
			return () => runtime.listeners.delete(listener)
		},
		[runtime],
	)
	const pending = useSyncExternalStore(
		subscribe,
		() => !!id && runtime.keys.has(`${generation}:${id}`),
	)
	return pending || busy || ended
}

export function useWorkLogPendingIds() {
	const client = useQueryClient()
	const { generation, busy, ended } = useIdentityLifecycle()
	const runtime = workLogRuntimeFor(client)
	const subscribe = useCallback(
		(listener: () => void) => {
			runtime.listeners.add(listener)
			return () => runtime.listeners.delete(listener)
		},
		[runtime],
	)
	useSyncExternalStore(subscribe, () => runtime.revision)
	return useCallback(
		(id: string) => busy || ended || runtime.keys.has(`${generation}:${id}`),
		[busy, ended, generation, runtime],
	)
}
