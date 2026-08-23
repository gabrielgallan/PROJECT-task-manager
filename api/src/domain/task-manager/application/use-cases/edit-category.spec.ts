import { makeCategory } from 'test/unit/factories/make-category'
import {
	InMemoryCategoriesRepository,
} from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditCategoryUseCase } from './edit-category'
import { InvalidCategoryError } from './errors/invalid-category-error'

let categoriesRepository: InMemoryCategoriesRepository

let sut: EditCategoryUseCase

describe('Edit category [USE CASE]', () => {
	beforeEach(() => {
		categoriesRepository = new InMemoryCategoriesRepository(
			new InMemoryPlansRepository(),
			new InMemoryWorkLogsRepository(),
		)

		sut = new EditCategoryUseCase(categoriesRepository)
	})

	it('should be able to edit a category', async () => {
		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
					name: 'Job Events',
					color: 'red',
				},
				new UniqueEntityID('category-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
			name: 'Study',
			color: 'cyan',
		})

		expect(categoriesRepository.items[0].name).toBe('Study')
		expect(categoriesRepository.items[0].color).toBe('cyan')
	})

	it('should not be able to edit a category of another user', async () => {
		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('category-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-2',
			categoryId: 'category-1',
			name: 'Study',
			color: 'cyan',
		})

		expect(result.value).instanceOf(NotAllowedError)
	})

	it('should not be able to edit a non-existent category', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
			name: 'Study',
			color: 'cyan',
		})

		expect(result.value).instanceOf(ResourceNotFoundError)
	})

	it('should normalize a category name when editing', async () => {
		await categoriesRepository.create(
			makeCategory(
				{ userId: new UniqueEntityID('user-1') },
				new UniqueEntityID('category-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
			name: '  Reunio\u0303es   Técnicas  ',
		})

		expect(categoriesRepository.items[0].name).toBe('Reuniões Técnicas')
	})

	it.each(['', '   ', 'a'.repeat(41)])(
		'should reject the invalid category name %j',
		async (name) => {
			await categoriesRepository.create(
				makeCategory(
					{ userId: new UniqueEntityID('user-1'), name: 'Study' },
					new UniqueEntityID('category-1'),
				),
			)

			const result = await sut.execute({
				userId: 'user-1',
				categoryId: 'category-1',
				name,
			})

			expect(result.value).toBeInstanceOf(InvalidCategoryError)
			expect(categoriesRepository.items[0].name).toBe('Study')
		},
	)

	it('should reject an invalid category color', async () => {
		await categoriesRepository.create(
			makeCategory(
				{ userId: new UniqueEntityID('user-1'), color: 'blue' },
				new UniqueEntityID('category-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
			color: 'not-a-color',
		})

		expect(result.value).toBeInstanceOf(InvalidCategoryError)
		expect(categoriesRepository.items[0].color).toBe('blue')
	})
})
