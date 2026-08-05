import { useSearchParams } from 'react-router-dom'

export const VIEW_SEARCH_PARAM = 'view'

/**
 * Keeps the active view in the URL, so it survives reloads and can be shared.
 * The header tabs and the page read the same source instead of lifting state.
 */
export function useViewParam<TView extends string>(
	values: readonly TView[],
	fallback: TView,
): [TView, (view: TView) => void] {
	const [searchParams, setSearchParams] = useSearchParams()

	const current = searchParams.get(VIEW_SEARCH_PARAM) as TView | null
	const view = current && values.includes(current) ? current : fallback

	const setView = (next: TView) => {
		setSearchParams((previous) => {
			// The default view stays implicit, so the URL only carries a real choice.
			if (next === fallback) {
				previous.delete(VIEW_SEARCH_PARAM)
			} else {
				previous.set(VIEW_SEARCH_PARAM, next)
			}

			return previous
		})
	}

	return [view, setView]
}
