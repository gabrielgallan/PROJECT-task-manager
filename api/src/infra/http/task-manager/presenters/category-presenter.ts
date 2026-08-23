import { Category } from '@/domain/task-manager/enterprise/entities/category'
import { CategoryDto } from '../dtos/category.dto'

export class CategoryPresenter {
	static toHTTP(category: Category): CategoryDto {
		return {
			id: category.id.toString(),
			name: category.name,
			color: category.color,
		}
	}
}
