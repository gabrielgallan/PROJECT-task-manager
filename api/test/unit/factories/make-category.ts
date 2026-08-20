import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Category, CategoryProps } from '@/domain/task-manager/enterprise/entities/category'

export function makeCategory(override: Partial<CategoryProps> = {}, id?: UniqueEntityID) {
	const category = Category.create(
		{
			userId: new UniqueEntityID(),
			name: faker.commerce.department(),
			color: faker.color.human(),
			...override,
		},
		id,
	)

	return category
}
