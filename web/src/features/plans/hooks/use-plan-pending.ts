import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'
import { planRuntimeFor } from '../model/plan-runtime'

export function usePlanPending(id?: string) {
	const client = useQueryClient()
	const { generation, busy, ended } = useIdentityLifecycle()
	const locks = planRuntimeFor(client)
	const subscribe = useCallback(
		(listener: () => void) => {
			locks.listeners.add(listener)
			return () => {
				locks.listeners.delete(listener)
			}
		},
		[locks],
	)
	const pending = useSyncExternalStore(
		subscribe,
		() => !!id && locks.keys.has(`${generation}:${id}`),
	)
	return pending || busy || ended
}

export function usePlanConfirmationBlocked(id?: string) {
	const client = useQueryClient()
	const { generation } = useIdentityLifecycle()
	const runtime = planRuntimeFor(client)
	const subscribe = useCallback(
		(listener: () => void) => {
			runtime.listeners.add(listener)
			return () => {
				runtime.listeners.delete(listener)
			}
		},
		[runtime],
	)
	return useSyncExternalStore(subscribe, () => !!id && runtime.confirmed.has(`${generation}:${id}`))
}

export function usePlanPendingIds() {
	const client = useQueryClient()
	const { generation, busy, ended } = useIdentityLifecycle()
	const runtime = planRuntimeFor(client)
	const subscribe = useCallback(
		(listener: () => void) => {
			runtime.listeners.add(listener)
			return () => {
				runtime.listeners.delete(listener)
			}
		},
		[runtime],
	)
	useSyncExternalStore(subscribe, () => runtime.revision)
	return useCallback(
		(id: string) => busy || ended || runtime.keys.has(`${generation}:${id}`),
		[busy, ended, generation, runtime],
	)
}
