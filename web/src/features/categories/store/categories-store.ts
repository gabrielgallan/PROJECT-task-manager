import { atom, useAtom } from 'jotai'
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories-query'
import type { TCategoryColor } from '@/features/categories/model/category-colors'
import { DEFAULT_UNCATEGORIZED_COLOR } from '@/features/categories/model/category-rules'
import type { ICategory } from '@/features/categories/model/category-types'

const uncategorizedColorAtom = atom<TCategoryColor>(DEFAULT_UNCATEGORIZED_COLOR)
const EMPTY_CATEGORIES: ICategory[] = []

export function useCategories() {
	const query = useCategoriesQuery()
	const [uncategorizedColor, setUncategorizedColor] = useAtom(uncategorizedColorAtom)

	return {
		...query,
		categories: query.data?.data ?? EMPTY_CATEGORIES,
		uncategorizedColor,
		setUncategorizedColor,
	}
}
