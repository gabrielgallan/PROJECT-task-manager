import type { TCategoryColor } from '@/features/categories/model/category-colors'

export interface ICategory {
	id: string
	name: string
	color: TCategoryColor
}

export interface ICategoryPreferences {
	uncategorizedColor: TCategoryColor
}
