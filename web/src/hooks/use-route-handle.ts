import type { LucideIcon } from 'lucide-react'
import { useMatches } from 'react-router-dom'

export interface IViewOption {
	value: string
	label: string
	icon: LucideIcon
}

/**
 * Per-route configuration read by the default layout. Routes declare what the
 * shared header should offer, so the layout never needs to know the pages.
 */
export interface IRouteHandle {
	/** View switcher options. The first entry is the default view. */
	views?: readonly IViewOption[]
}

export function useRouteHandle(): IRouteHandle {
	const matches = useMatches()

	return (matches.at(-1)?.handle ?? {}) as IRouteHandle
}
