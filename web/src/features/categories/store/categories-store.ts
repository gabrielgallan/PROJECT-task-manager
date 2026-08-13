import { atom, useAtom } from 'jotai'
import { useCallback } from 'react'
import { CATEGORIES_MOCK } from '@/features/categories/mocks/categories'
import type { TCategoryColor } from '@/features/categories/model/category-colors'
import { DEFAULT_UNCATEGORIZED_COLOR } from '@/features/categories/model/category-rules'
import type { ICategory } from '@/features/categories/model/category-types'

const categoriesAtom = atom<ICategory[]>(CATEGORIES_MOCK)
const uncategorizedColorAtom = atom<TCategoryColor>(DEFAULT_UNCATEGORIZED_COLOR)

export function useCategories() {
	const [categories, setCategories] = useAtom(categoriesAtom)
	const [uncategorizedColor, setUncategorizedColor] = useAtom(uncategorizedColorAtom)

	const addCategory = useCallback(
		(category: ICategory) => setCategories((previous) => [...previous, category]),
		[setCategories],
	)

	const updateCategory = useCallback(
		(category: ICategory) =>
			setCategories((previous) =>
				previous.map((item) => (item.id === category.id ? category : item)),
			),
		[setCategories],
	)

	const removeCategory = useCallback(
		(categoryId: string) =>
			setCategories((previous) => previous.filter((category) => category.id !== categoryId)),
		[setCategories],
	)

	return {
		categories,
		uncategorizedColor,
		addCategory,
		updateCategory,
		removeCategory,
		setUncategorizedColor,
	}
}
