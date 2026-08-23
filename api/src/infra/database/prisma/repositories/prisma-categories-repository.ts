import { Injectable } from '@nestjs/common'
import { CategoriesRepository } from '@/domain/task-manager/application/repositories/categories-repository'
import { Category } from '@/domain/task-manager/enterprise/entities/category'
import { PrismaCategoryMapper } from '../mappers/prisma-category-mapper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
	constructor(private prisma: PrismaService) {}

	async create(category: Category) {
		await this.prisma.category.create({
			data: PrismaCategoryMapper.toPrisma(category),
		})
	}

	async fetchAllByUserId(userId: string) {
		const categories = await this.prisma.category.findMany({
			where: { userId },
			orderBy: { name: 'asc' },
		})

		return categories.map(PrismaCategoryMapper.toDomain)
	}

	async findById(categoryId: string) {
		const category = await this.prisma.category.findUnique({
			where: { id: categoryId },
		})

		return category ? PrismaCategoryMapper.toDomain(category) : null
	}

	async countRelatedRecords(categoryId: string) {
		const [plansCount, workLogsCount] = await this.prisma.$transaction([
			this.prisma.plan.count({ where: { categoryId } }),
			this.prisma.workLog.count({ where: { categoryId } }),
		])

		return { plansCount, workLogsCount }
	}

	async save(category: Category) {
		await this.prisma.category.update({
			where: { id: category.id.toString() },
			data: PrismaCategoryMapper.toPrisma(category),
		})
	}

	async delete(category: Category) {
		await this.prisma.category.delete({
			where: { id: category.id.toString() },
		})
	}
}
