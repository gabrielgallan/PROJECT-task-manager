import type { Category as PrismaCategory, Prisma } from 'generated/prisma/client'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
	Category,
	isCategoryColor,
} from '@/domain/task-manager/enterprise/entities/category'

export class PrismaCategoryMapper {
	static toDomain(raw: PrismaCategory): Category {
		if (!isCategoryColor(raw.color)) {
			throw new Error(`Invalid category color stored in database: ${raw.color}`)
		}

		return Category.create(
			{
				userId: new UniqueEntityID(raw.userId),
				name: raw.name,
				color: raw.color,
				createdAt: raw.createdAt,
				updatedAt: raw.updatedAt,
			},
			new UniqueEntityID(raw.id),
		)
	}

	static toPrisma(category: Category): Prisma.CategoryUncheckedCreateInput {
		return {
			id: category.id.toString(),
			userId: category.userId.toString(),
			name: category.name,
			color: category.color,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
		}
	}
}
