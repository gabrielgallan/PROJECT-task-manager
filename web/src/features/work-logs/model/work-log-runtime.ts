import type { QueryClient } from '@tanstack/react-query'

interface WorkLogRuntime {
	keys: Set<string>
	listeners: Set<() => void>
	revision: number
}

const clients = new WeakMap<QueryClient, WorkLogRuntime>()

export function workLogRuntimeFor(client: QueryClient): WorkLogRuntime {
	let runtime = clients.get(client)
	if (!runtime) {
		runtime = { keys: new Set(), listeners: new Set(), revision: 0 }
		clients.set(client, runtime)
	}
	return runtime
}

function notify(runtime: WorkLogRuntime) {
	runtime.revision += 1
	for (const listener of runtime.listeners) listener()
}

export function acquireWorkLogLock(client: QueryClient, generation: number, id: string) {
	const runtime = workLogRuntimeFor(client)
	const key = `${generation}:${id}`
	if (runtime.keys.has(key)) return null
	runtime.keys.add(key)
	notify(runtime)
	return () => {
		runtime.keys.delete(key)
		notify(runtime)
	}
}

export function clearWorkLogRuntime(client: QueryClient) {
	const runtime = workLogRuntimeFor(client)
	runtime.keys.clear()
	notify(runtime)
}
