import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'
import { useIdentityLifecycle } from '@/features/identity/hooks/use-end-session'

interface TaskLocks { keys: Set<string>; listeners: Set<() => void> }
const clients = new WeakMap<QueryClient, TaskLocks>()
function locksFor(client: QueryClient) {
	let locks = clients.get(client)
	if (!locks) { locks = { keys: new Set(), listeners: new Set() }; clients.set(client, locks) }
	return locks
}
export function acquireTaskLock(client: QueryClient, generation: number, id: string) {
	const locks = locksFor(client)
	const key = `${generation}:${id}`
	if (locks.keys.has(key)) return null
	locks.keys.add(key)
	for (const listener of locks.listeners) listener()
	return () => {
		locks.keys.delete(key)
		for (const listener of locks.listeners) listener()
	}
}
export function useTaskPending(id: string | undefined) {
	const client = useQueryClient()
	const { generation, busy, ended } = useIdentityLifecycle()
	const locks = locksFor(client)
	const subscribe = useCallback((listener: () => void) => {
		locks.listeners.add(listener)
		return () => { locks.listeners.delete(listener) }
	}, [locks])
	const pending = useSyncExternalStore(subscribe, () => !!id && locks.keys.has(`${generation}:${id}`))
	return pending || busy || ended
}
