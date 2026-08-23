import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
	Category,
	CATEGORY_COLORS,
	CategoryProps,
} from '@/domain/task-manager/enterprise/entities/category'

export function makeCategory(override: Partial<CategoryProps> = {}, id?: UniqueEntityID) {
	const category = Category.create(
		{
			userId: new UniqueEntityID(),
			name: faker.commerce.department(),
			color: faker.helpers.arrayElement(CATEGORY_COLORS),
			...override,
		},
		id,
	)

	return category
}
