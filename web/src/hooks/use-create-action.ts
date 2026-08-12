import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export const COMMAND_ACTION_PARAM = 'action'
export const COMMAND_CREATE_ACTION = 'create'

/** Consumes the command palette's create request once, including in Strict Mode. */
export function useCreateAction(onCreate: () => void) {
	const [searchParams, setSearchParams] = useSearchParams()
	const handledRef = useRef(false)
	const action = searchParams.get(COMMAND_ACTION_PARAM)

	useEffect(() => {
		if (action !== COMMAND_CREATE_ACTION) {
			handledRef.current = false
			return
		}

		if (handledRef.current) return

		handledRef.current = true
		onCreate()

		setSearchParams(
			(previous) => {
				const next = new URLSearchParams(previous)
				next.delete(COMMAND_ACTION_PARAM)
				return next
			},
			{ replace: true },
		)
	}, [action, onCreate, setSearchParams])
}
