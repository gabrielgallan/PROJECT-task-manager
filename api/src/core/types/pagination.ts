export interface PaginationMeta {
	limit: number
	page: number
	total: number
}

export interface PaginationInput {
	limit: number
	page: number
}

export interface PaginatedList<T> {
	data: T[]
	meta: PaginationMeta
}
