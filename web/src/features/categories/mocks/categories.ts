import type { ICategory } from '@/features/categories/model/category-types'

export const CATEGORIES_MOCK: ICategory[] = [
	{ id: 'category-development', name: 'Development', color: 'blue' },
	{ id: 'category-review', name: 'Review', color: 'green' },
	{ id: 'category-urgent', name: 'Urgent', color: 'red' },
	{ id: 'category-administration', name: 'Administration', color: 'yellow' },
	{ id: 'category-planning', name: 'Planning', color: 'purple' },
	{ id: 'category-meetings', name: 'Meetings', color: 'orange' },
	{ id: 'category-focus', name: 'Focus', color: 'pink' },
]

export const CATEGORY_ID_BY_COLOR = new Map(
	CATEGORIES_MOCK.map((category) => [category.color, category.id]),
)
