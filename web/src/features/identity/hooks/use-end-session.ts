import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getProfile } from '@/api/get-profile'
import { signOut } from '@/api/sign-out'
import { categoryKeys } from '@/features/categories/model/category-query-keys'
import { planKeys } from '@/features/plans/model/plan-query-keys'
import { clearPlanRuntime } from '@/features/plans/model/plan-runtime'
import { taskKeys } from '@/features/tasks/model/task-query-keys'
import { workLogKeys } from '@/features/work-logs/model/work-log-query-keys'
import { clearWorkLogRuntime } from '@/features/work-logs/model/work-log-runtime'
import { profileQueryKey, sessionsQueryKey } from '../model/identity'
import { getHttpStatus, getIdentityError } from '../model/identity-errors'

interface Lifecycle {
	snapshot: { generation: number; busy: boolean; ended: boolean }
	listeners: Set<() => void>
}

const lifecycles = new WeakMap<QueryClient, Lifecycle>()

function getLifecycle(client: QueryClient) {
	let lifecycle = lifecycles.get(client)
	if (!lifecycle) {
		lifecycle = { snapshot: { generation: 0, busy: false, ended: false }, listeners: new Set() }
		lifecycles.set(client, lifecycle)
	}
	return lifecycle
}

function update(lifecycle: Lifecycle, values: Partial<Lifecycle['snapshot']>) {
	lifecycle.snapshot = { ...lifecycle.snapshot, ...values }
	for (const listener of lifecycle.listeners) listener()
}

async function clearIdentity(client: QueryClient) {
	await Promise.all([
		client.cancelQueries({ queryKey: profileQueryKey, exact: true }),
		client.cancelQueries({ queryKey: sessionsQueryKey, exact: true }),
		client.cancelQueries({ queryKey: categoryKeys.all }),
		client.cancelQueries({ queryKey: taskKeys.all }),
		client.cancelQueries({ queryKey: planKeys.all }),
		client.cancelQueries({ queryKey: workLogKeys.all }),
	])
	client.removeQueries({ queryKey: profileQueryKey, exact: true })
	client.removeQueries({ queryKey: sessionsQueryKey, exact: true })
	client.removeQueries({ queryKey: categoryKeys.all })
	client.removeQueries({ queryKey: taskKeys.all })
	client.removeQueries({ queryKey: planKeys.all })
	client.removeQueries({ queryKey: workLogKeys.all })
	clearPlanRuntime(client)
	clearWorkLogRuntime(client)
	const mutations = client.getMutationCache()
	for (const mutation of mutations.findAll({ mutationKey: ['identity'] })) {
		mutations.remove(mutation)
	}
	for (const mutation of mutations.findAll({ mutationKey: categoryKeys.all })) {
		mutations.remove(mutation)
	}
	for (const mutation of mutations.findAll({ mutationKey: taskKeys.all })) {
		mutations.remove(mutation)
	}
	for (const mutation of mutations.findAll({ mutationKey: planKeys.all })) {
		mutations.remove(mutation)
	}
	for (const mutation of mutations.findAll({ mutationKey: workLogKeys.all })) {
		mutations.remove(mutation)
	}
}

export function useIdentityLifecycle() {
	const client = useQueryClient()
	const lifecycle = getLifecycle(client)
	const mounted = useRef(true)
	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])
	const subscribe = useCallback(
		(listener: () => void) => {
			lifecycle.listeners.add(listener)
			return () => {
				lifecycle.listeners.delete(listener)
			}
		},
		[lifecycle],
	)
	const snapshot = useSyncExternalStore(subscribe, () => lifecycle.snapshot)
	const capture = useCallback(() => {
		const generation = lifecycle.snapshot.generation
		return () => mounted.current && lifecycle.snapshot.generation === generation
	}, [lifecycle])

	return { ...snapshot, capture, client }
}

export function useEndSession() {
	const { client, capture, busy, ended } = useIdentityLifecycle()
	const lifecycle = getLifecycle(client)
	const navigate = useNavigate()
	const logout = useMutation({
		mutationKey: ['identity', 'sign-out'],
		mutationFn: signOut,
		retry: false,
		networkMode: 'always',
		gcTime: 0,
	})

	const endSession = useCallback(
		async (message = 'Your session has ended. Please sign in.') => {
			if (lifecycle.snapshot.ended) return
			update(lifecycle, { ended: true, busy: true, generation: lifecycle.snapshot.generation + 1 })
			await clearIdentity(client)
			navigate('/auth/sign-in', { replace: true })
			update(lifecycle, { busy: false })
			toast.info(message)
		},
		[client, lifecycle, navigate],
	)

	const afterSignIn = async () => {
		update(lifecycle, { busy: true, ended: false, generation: lifecycle.snapshot.generation + 1 })
		await clearIdentity(client)
		navigate('/registers/tasks', { replace: true })
		update(lifecycle, { busy: false })
	}

	const revalidateSession = async (error: unknown, includeNotFound = false) => {
		const status = getHttpStatus(error)
		if (status !== 401 && !(includeNotFound && status === 404)) return false
		const generation = lifecycle.snapshot.generation
		const current = () => lifecycle.snapshot.generation === generation
		try {
			await client.fetchQuery({
				queryKey: profileQueryKey,
				queryFn: getProfile,
				staleTime: 0,
				retry: false,
			})
		} catch (profileError) {
			if (!current()) return true
			if (getHttpStatus(profileError) === 401) {
				await endSession()
				return true
			}
		}
		return !current()
	}

	const handleSignOut = async () => {
		if (lifecycle.snapshot.busy || lifecycle.snapshot.ended) return
		// Session cleanup must finish even if navigation unmounts the initiating menu.
		const generation = lifecycle.snapshot.generation
		const current = () => lifecycle.snapshot.generation === generation
		update(lifecycle, { busy: true })
		try {
			await logout.mutateAsync()
			if (current()) await endSession('You have been signed out.')
		} catch (error) {
			if (current() && !(await revalidateSession(error, true)) && current()) {
				toast.error(getIdentityError(error, 'logout'))
			}
		} finally {
			if (current()) update(lifecycle, { busy: false })
		}
	}

	return { endSession, afterSignIn, revalidateSession, handleSignOut, capture, busy, ended, client }
}
