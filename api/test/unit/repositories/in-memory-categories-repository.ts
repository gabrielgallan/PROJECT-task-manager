import { CategoriesRepository } from '@/domain/task-manager/application/repositories/categories-repository'
import { Category } from '@/domain/task-manager/enterprise/entities/category'

export class InMemoryCategoriesRepository implements CategoriesRepository {
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
