import { Category } from '../../enterprise/entities/category'

export abstract class CategoriesRepository {
	abstract create(category: Category): Promise<void>
	abstract fetchAllByUserId(userId: string): Promise<Category[]>
	abstract findById(categoryId: string): Promise<Category | null>
	abstract save(category: Category): Promise<void>
	abstract delete(category: Category): Promise<void>
}
