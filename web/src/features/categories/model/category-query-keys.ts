export const categoryKeys = {
	all: ['categories'] as const,
	list: (generation: number) => ['categories', generation, 'list'] as const,
	deletionImpact: (generation: number, categoryId: string) =>
		['categories', generation, 'deletion-impact', categoryId] as const,
	mutation: (generation: number, operation: 'create' | 'edit' | 'delete') =>
		['categories', generation, operation] as const,
}
