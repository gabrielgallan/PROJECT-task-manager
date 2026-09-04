import type { QueryClient } from '@tanstack/react-query'

interface PlanRuntime {
	keys: Set<string>
	confirmed: Set<string>
	listeners: Set<() => void>
	revision: number
}

const clients = new WeakMap<QueryClient, PlanRuntime>()

export function planRuntimeFor(client: QueryClient): PlanRuntime {
	let runtime = clients.get(client)
	if (!runtime) {
		runtime = { keys: new Set(), confirmed: new Set(), listeners: new Set(), revision: 0 }
		clients.set(client, runtime)
	}
	return runtime
}

function notify(runtime: PlanRuntime) {
	runtime.revision += 1
	for (const listener of runtime.listeners) listener()
}

export function acquirePlanLock(
	client: QueryClient,
	generation: number,
	id: string,
	blockConfirmed = false,
) {
	const runtime = planRuntimeFor(client)
	const key = `${generation}:${id}`
	if (runtime.keys.has(key) || (blockConfirmed && runtime.confirmed.has(key))) return null
	runtime.keys.add(key)
	notify(runtime)
	return () => {
		runtime.keys.delete(key)
		notify(runtime)
	}
}

export function markPlanConfirmed(client: QueryClient, generation: number, id: string) {
	const runtime = planRuntimeFor(client)
	runtime.confirmed.add(`${generation}:${id}`)
	notify(runtime)
}

export function clearPlanRuntime(client: QueryClient) {
	const runtime = planRuntimeFor(client)
	runtime.keys.clear()
	runtime.confirmed.clear()
	notify(runtime)
}
