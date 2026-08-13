import type { TCategoryColor } from '@/features/categories/model/category-colors'
import type { ICategory } from '@/features/categories/model/category-types'

export const DEFAULT_UNCATEGORIZED_COLOR: TCategoryColor = 'blue'

export const NO_CATEGORY_FILTER = 'no-category'

export function resolveCategoryColor(
	categoryId: string | null | undefined,
	categoriesById: Map<string, ICategory>,
	fallback: TCategoryColor,
): TCategoryColor {
	return (categoryId ? categoriesById.get(categoryId)?.color : undefined) ?? fallback
}

export function normalizeCategoryName(name: string): string {
	return name.trim().toLocaleLowerCase()
}
