export interface PaginationInput {
	limit: number;
	page: number;
}

export interface PaginatedList<T> {
	data: T[]
	meta: {
		limit: number;
		page: number;
		total: number;
	};
}
