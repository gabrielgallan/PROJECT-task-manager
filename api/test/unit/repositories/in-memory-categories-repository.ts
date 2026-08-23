import { CategoriesRepository } from '@/domain/task-manager/application/repositories/categories-repository'
import { Category } from '@/domain/task-manager/enterprise/entities/category'
import { InMemoryPlansRepository } from './in-memory-plans-repository'
import { InMemoryWorkLogsRepository } from './in-memory-work-logs-repository'

export class InMemoryCategoriesRepository implements CategoriesRepository {
	constructor(
		private plansRepository: InMemoryPlansRepository,
		private workLogsRepository: InMemoryWorkLogsRepository,
	) {}

	public items: Category[] = []

	async create(category: Category) {
		this.items.push(category)

		return
	}

	async findById(categoryId: string) {
		const category = this.items.find((c) => c.id.toString() === categoryId)

		return category ?? null
	}

	async fetchAllByUserId(userId: string) {
		const categories = this.items.filter((c) => c.userId.toString() === userId)

		return categories
	}

	async countRelatedRecords(categoryId: string) {
		const plans = this.plansRepository.items.filter((p) => p.categoryId?.toString() === categoryId)
		const workLogs = this.workLogsRepository.items.filter(
			(w) => w.categoryId?.toString() === categoryId,
		)

		return {
			plansCount: plans.length,
			workLogsCount: workLogs.length,
		}
	}

	async save(category: Category) {
		const categoryIndex = this.items.findIndex((c) => c.id.toString() === category.id.toString())

		if (categoryIndex >= 0) {
			this.items[categoryIndex] = category
		}

		return
	}

	async delete(category: Category) {
		this.items = this.items.filter((c) => c.id.toString() !== category.id.toString())

		return
	}
}
