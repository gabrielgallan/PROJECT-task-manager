import {
	InMemoryCategoriesRepository,
} from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { CATEGORY_COLORS } from '../../enterprise/entities/category'
import { CreateCategoryUseCase } from './create-category'
import { InvalidCategoryError } from './errors/invalid-category-error'

let categoriesRepository: InMemoryCategoriesRepository

let sut: CreateCategoryUseCase

describe('Create category [USE CASE]', () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository(
			new InMemoryPlansRepository(),
			new InMemoryWorkLogsRepository(),
		)
		sut = new CreateCategoryUseCase(categoriesRepository)
	})

	it('should be able to create a category', async () => {
		await sut.execute({
			userId: 'user-1',
			name: '  Reunio\u0303es   Técnicas  ',
			color: 'blue',
		})

		expect(categoriesRepository.items).toHaveLength(1)
		expect(categoriesRepository.items[0].name).toBe('Reuniões Técnicas')
		expect(categoriesRepository.items[0].color).toBe('blue')
		expect(categoriesRepository.items[0].userId.toString()).toBe('user-1')
		expect(categoriesRepository.items[0].createdAt).toEqual(expect.any(Date))
		expect(categoriesRepository.items[0].updatedAt).toBe(null)
	})

	it.each(CATEGORY_COLORS)('should accept the category color %s', async (color) => {
		const result = await sut.execute({
			userId: 'user-1',
			name: 'Study',
			color,
		})

		expect(result.isRight()).toBe(true)
	})

	it.each(['', '   ', 'a'.repeat(41)])(
		'should reject the invalid category name %j',
		async (name) => {
			const result = await sut.execute({
				userId: 'user-1',
				name,
				color: 'blue',
			})

			expect(result.value).toBeInstanceOf(InvalidCategoryError)
			expect(categoriesRepository.items).toHaveLength(0)
		},
	)

	it('should reject an invalid category color', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			name: 'Study',
			color: 'not-a-color',
		})

		expect(result.value).toBeInstanceOf(InvalidCategoryError)
		expect(categoriesRepository.items).toHaveLength(0)
	})
})
