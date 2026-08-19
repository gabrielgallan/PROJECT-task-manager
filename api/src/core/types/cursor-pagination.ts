export type CursorPaginatedList<T, TCursor> = {
	items: T[]
	nextCursor: TCursor | null
}
