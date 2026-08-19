import { BadRequestException } from '@nestjs/common'
import {
	TaskSortByOptions,
	TaskSortInput,
} from '@/domain/task-manager/application/repositories/tasks-repository'

interface TaskSortQuery {
	sortBy?: TaskSortByOptions
	sortDir?: 'asc' | 'desc'
}

export function parseTaskSortQuery({ sortBy, sortDir }: TaskSortQuery): TaskSortInput | undefined {
	if (sortBy && sortDir) {
		return {
			by: sortBy,
			dir: sortDir,
		}
	}

	if ((sortBy && !sortDir) || (sortDir && !sortBy)) {
		throw new BadRequestException(`Invalid sort query! Missing field 'sortBy' or 'sortDir'`)
	}

	return undefined
}
