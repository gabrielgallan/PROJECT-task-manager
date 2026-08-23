import { makeWorkLog } from 'test/unit/factories/make-work-logs'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CreateWorkLogUseCase } from './create-work-log'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

let workLogsRepository: InMemoryWorkLogsRepository
let tasksRepository: InMemoryTasksRepository
let categoriesRepository: InMemoryCategoriesRepository

let sut: CreateWorkLogUseCase

describe('Create work-log [USE CASE]', () => {
	beforeEach(() => {
		workLogsRepository = new InMemoryWorkLogsRepository()
		tasksRepository = new InMemoryTasksRepository()
		categoriesRepository = new InMemoryCategoriesRepository(
			new InMemoryPlansRepository(),
			new InMemoryWorkLogsRepository(),
		)

		sut = new CreateWorkLogUseCase(workLogsRepository, tasksRepository, categoriesRepository)

		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('should be able to create a work-log', async () => {
		await sut.execute({
			userId: 'user-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 10),
			endsAt: new Date(2026, 0, 12, 11),
		})

		expect(workLogsRepository.items).toHaveLength(1)
		expect(workLogsRepository.items[0].taskId).toBeNull()
		expect(workLogsRepository.items[0].categoryId).toBeNull()
		expect(workLogsRepository.items[0].title).toBe('HID integration')
		expect(workLogsRepository.items[0].description).toBeNull()
		expect(workLogsRepository.items[0].startsAt).toEqual(new Date(2026, 0, 12, 10))
		expect(workLogsRepository.items[0].endsAt).toEqual(new Date(2026, 0, 12, 11))
		expect(workLogsRepository.items[0].createdAt).toEqual(expect.any(Date))
		expect(workLogsRepository.items[0].updatedAt).toBeNull()
	})

	it('should not be able to create a work log when endsAt is before startsAt', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 12),
			endsAt: new Date(2026, 0, 12, 9),
		})

		expect(result.value).instanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('endsAt must be after startsAt')
	})

	it('should not be able to create a work log when endsAt is in the future', async () => {
		vi.setSystemTime(new Date(2026, 0, 12, 18, 0, 0))

		const result = await sut.execute({
			userId: 'user-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 17),
			endsAt: new Date(2026, 0, 12, 18, 30),
		})

		expect(result.value).instanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('endsAt cannot be in the future')
	})

	it('should not be able to create a work log when startsAt and endsAt are on different days', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 22),
			endsAt: new Date(2026, 0, 13, 1),
		})

		expect(result.value).instanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('startsAt and endsAt must be on the same day')
	})

	it('should not be able to create a work log when its interval overlaps an existing work log', async () => {
		await workLogsRepository.create(
			makeWorkLog({
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date(2026, 0, 12, 10, 0, 0),
				endsAt: new Date(2026, 0, 12, 12, 0, 0),
			}),
		)

		const result = await sut.execute({
			userId: 'user-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 11, 30, 0),
			endsAt: new Date(2026, 0, 12, 12, 30, 0),
		})

		expect(result.value).instanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('The work log interval overlaps an existing work log')
	})
})
