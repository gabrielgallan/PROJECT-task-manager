import { makeCategory } from 'test/unit/factories/make-category'
import { makeTask } from 'test/unit/factories/make-tasks'
import { makeWorkLog } from 'test/unit/factories/make-work-logs'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { CreateWorkLogUseCase } from './create-work-log'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'
import { InvalidTimeZoneError } from './errors/invalid-time-zone-error'

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
		await tasksRepository.create(
			makeTask(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('task-1'),
			),
		)

		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('category-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			taskId: 'task-1',
			categoryId: 'category-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 10),
			endsAt: new Date(2026, 0, 12, 11),
			timeZone: 'UTC',
		})

		expect(workLogsRepository.items).toHaveLength(1)
		expect(workLogsRepository.items[0].taskId?.toString()).toBe('task-1')
		expect(workLogsRepository.items[0].categoryId?.toString()).toBe('category-1')
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
			timeZone: 'UTC',
		})

		expect(result.value).instanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('endsAt must be after startsAt')
	})

	it('should not be able to create a work log relationed with another user task or category', async () => {
		await tasksRepository.create(
			makeTask(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('task-1'),
			),
		)

		await categoriesRepository.create(
			makeCategory(
				{
					userId: new UniqueEntityID('user-1'),
				},
				new UniqueEntityID('category-1'),
			),
		)

		const result1 = await sut.execute({
			userId: 'user-2',
			taskId: 'task-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 10),
			endsAt: new Date(2026, 0, 12, 11),
			timeZone: 'UTC',
		})

		const result2 = await sut.execute({
			userId: 'user-2',
			categoryId: 'category-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 11),
			endsAt: new Date(2026, 0, 12, 12),
			timeZone: 'UTC',
		})

		expect(result1.value).instanceOf(NotAllowedError)
		expect(result2.value).instanceOf(NotAllowedError)
	})

	it('should not be able to create a work log relationed with an non-existent task or category', async () => {
		const result1 = await sut.execute({
			userId: 'user-1',
			taskId: 'task-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 10),
			endsAt: new Date(2026, 0, 12, 11),
			timeZone: 'UTC',
		})

		const result2 = await sut.execute({
			userId: 'user-1',
			categoryId: 'category-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 11),
			endsAt: new Date(2026, 0, 12, 12),
			timeZone: 'UTC',
		})

		expect(result1.value).instanceOf(ResourceNotFoundError)
		expect(result2.value).instanceOf(ResourceNotFoundError)
	})

	it('should not be able to create a work log when endsAt is in the future', async () => {
		vi.setSystemTime(new Date(2026, 0, 12, 18, 0, 0))

		const result = await sut.execute({
			userId: 'user-1',
			title: 'HID integration',
			startsAt: new Date(2026, 0, 12, 17),
			endsAt: new Date(2026, 0, 12, 18, 30),
			timeZone: 'UTC',
		})

		expect(result.value).instanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('endsAt cannot be in the future')
	})

	it('should reject a work log whose interval crosses a calendar day', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			title: 'HID integration',
			startsAt: new Date('2026-01-12T22:00:00.000Z'),
			endsAt: new Date('2026-01-13T01:00:00.000Z'),
			timeZone: 'UTC',
		})

		expect(result.value).instanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('startsAt and endsAt must be on the same day')
	})

	it('should reject a work log whose interval overlaps another work log', async () => {
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
			timeZone: 'UTC',
		})

		expect(result.value).instanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('The work log interval overlaps an existing work log')
	})

	it('should reject an invalid IANA time zone before accessing repositories', async () => {
		const overlapSpy = vi.spyOn(workLogsRepository, 'findByUserIdOverlapping')

		const result = await sut.execute({
			userId: 'user-1',
			title: 'HID integration',
			startsAt: new Date('2026-01-12T10:00:00.000Z'),
			endsAt: new Date('2026-01-12T11:00:00.000Z'),
			timeZone: 'Not/A_TimeZone',
		})

		expect(result.value).toBeInstanceOf(InvalidTimeZoneError)
		expect(overlapSpy).not.toHaveBeenCalled()
		expect(workLogsRepository.items).toHaveLength(0)
	})

	it('should reject an interval that crosses the user calendar day', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			title: 'Late work',
			startsAt: new Date('2026-01-12T02:30:00.000Z'),
			endsAt: new Date('2026-01-12T03:30:00.000Z'),
			timeZone: 'America/Sao_Paulo',
		})

		expect(result.value).toBeInstanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('startsAt and endsAt must be on the same day')
	})

	it('should accept different UTC dates that belong to the same user calendar day', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			title: 'Late work',
			startsAt: new Date('2026-01-12T23:30:00.000Z'),
			endsAt: new Date('2026-01-13T00:30:00.000Z'),
			timeZone: 'America/Sao_Paulo',
		})

		expect(result.isRight()).toBe(true)
		expect(workLogsRepository.items).toHaveLength(1)
	})
})
