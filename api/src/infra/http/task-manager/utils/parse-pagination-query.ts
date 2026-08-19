import { BadRequestException } from '@nestjs/common'
import type { PaginationInput } from '@/core/types/pagination'

interface PaginationQuery {
	page?: number
	limit?: number
}

export function parsePaginationQuery({
	page,
	limit,
}: PaginationQuery): PaginationInput | undefined {
	if (page && limit) {
		return {
			page,
			limit,
		}
	}

	if ((page && !limit) || (limit && !page)) {
		throw new BadRequestException('Invalid pagination query')
	}

	return undefined
}
