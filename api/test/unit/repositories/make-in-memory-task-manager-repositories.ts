import { InMemoryCategoriesRepository } from './in-memory-categories-repository'
import { InMemoryPlansRepository } from './in-memory-plans-repository'
import { InMemoryTasksRepository } from './in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from './in-memory-work-logs-repository'

export function makeInMemoryTaskManagerRepositories() {
	const tasksRepository = new InMemoryTasksRepository()
	let categoriesRepository: InMemoryCategoriesRepository
	const getCategoriesRepository = () => categoriesRepository
	const plansRepository = new InMemoryPlansRepository(tasksRepository, getCategoriesRepository)
	const workLogsRepository = new InMemoryWorkLogsRepository(
		tasksRepository,
		getCategoriesRepository,
	)

	categoriesRepository = new InMemoryCategoriesRepository(plansRepository, workLogsRepository)

	return {
		tasksRepository,
		categoriesRepository,
		plansRepository,
		workLogsRepository,
	}
}
