import { makeCategory } from 'test/unit/factories/make-category'
import { makeTask } from 'test/unit/factories/make-tasks'
import { makeWorkLog } from 'test/unit/factories/make-work-logs'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { makeInMemoryTaskManagerRepositories } from 'test/unit/repositories/make-in-memory-task-manager-repositories'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { EditWorkLogUseCase } from './edit-work-log'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'
import { InvalidTimeZoneError } from './errors/invalid-time-zone-error'

let workLogsRepository: InMemoryWorkLogsRepository
let tasksRepository: InMemoryTasksRepository
let categoriesRepository: InMemoryCategoriesRepository

let sut: EditWorkLogUseCase

describe('Edit work-log [USE CASE]', () => {
	beforeEach(() => {
		;({ workLogsRepository, tasksRepository, categoriesRepository } =
			makeInMemoryTaskManagerRepositories())

		sut = new EditWorkLogUseCase(workLogsRepository, tasksRepository, categoriesRepository)
	})

	it('should be able to edit a work-log', async () => {
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

		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-1'),
					categoryId: new UniqueEntityID('category-1'),
					title: 'Team morning meet',
					description: null,
					startsAt: new Date(2026, 0, 12, 10, 0, 0),
					endsAt: new Date(2026, 0, 12, 12, 0, 0),
				},
				new UniqueEntityID('work-log-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			categoryId: null,
			taskId: 'task-1',
			title: 'HOTFIX: Fix JWT feature',
			description: 'Teams morning meet (CANCELED)',
			startsAt: new Date(2026, 0, 12, 9, 30, 0),
			timeZone: 'UTC',
		})

		expect(workLogsRepository.items[0].categoryId).toBeNull()
		expect(workLogsRepository.items[0].taskId?.toString()).toBe('task-1')
		expect(workLogsRepository.items[0].title).toBe('HOTFIX: Fix JWT feature')
		expect(workLogsRepository.items[0].description).toBe('Teams morning meet (CANCELED)')
		expect(workLogsRepository.items[0].startsAt).toEqual(new Date(2026, 0, 12, 9, 30, 0))
		expect(workLogsRepository.items[0].endsAt).toEqual(new Date(2026, 0, 12, 12, 0, 0))
	})

	it('should reject an invalid IANA time zone before accessing repositories', async () => {
		const findByIdSpy = vi.spyOn(workLogsRepository, 'findById')

		const result = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			timeZone: 'Invalid/TimeZone',
		})

		expect(result.value).toBeInstanceOf(InvalidTimeZoneError)
		expect(findByIdSpy).not.toHaveBeenCalled()
	})

	it('should reject a missing or another user work log', async () => {
		const missing = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			timeZone: 'UTC',
		})

		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-2'),
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('work-log-1'),
			),
		)

		const anotherUser = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			timeZone: 'UTC',
		})

		expect(missing.value).toBeInstanceOf(ResourceNotFoundError)
		expect(anotherUser.value).toBeInstanceOf(NotAllowedError)
	})

	it('should validate referenced task and category ownership', async () => {
		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('work-log-1'),
			),
		)

		const missingTask = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			taskId: 'task-1',
			timeZone: 'UTC',
		})

		await tasksRepository.create(
			makeTask({ userId: new UniqueEntityID('user-2') }, new UniqueEntityID('task-1')),
		)

		const anotherUserTask = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			taskId: 'task-1',
			timeZone: 'UTC',
		})
		const missingCategory = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			categoryId: 'category-1',
			timeZone: 'UTC',
		})

		await categoriesRepository.create(
			makeCategory({ userId: new UniqueEntityID('user-2') }, new UniqueEntityID('category-1')),
		)

		const anotherUserCategory = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			categoryId: 'category-1',
			timeZone: 'UTC',
		})

		expect(missingTask.value).toBeInstanceOf(ResourceNotFoundError)
		expect(anotherUserTask.value).toBeInstanceOf(NotAllowedError)
		expect(missingCategory.value).toBeInstanceOf(ResourceNotFoundError)
		expect(anotherUserCategory.value).toBeInstanceOf(NotAllowedError)
	})

	it('should reject invalid, cross-day and future intervals', async () => {
		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('work-log-1'),
			),
		)

		const invalid = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			startsAt: new Date('2026-01-12T10:00:00.000Z'),
			endsAt: new Date('2026-01-12T10:00:00.000Z'),
			timeZone: 'UTC',
		})
		const crossDay = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			startsAt: new Date('2026-01-12T23:30:00.000Z'),
			endsAt: new Date('2026-01-13T00:30:00.000Z'),
			timeZone: 'UTC',
		})
		const future = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			startsAt: new Date('2100-01-12T10:00:00.000Z'),
			endsAt: new Date('2100-01-12T11:00:00.000Z'),
			timeZone: 'UTC',
		})

		expect(invalid.value).toBeInstanceOf(InvalidDatetimeError)
		expect(invalid.value.message).toBe('endsAt must be after startsAt')
		expect(crossDay.value).toBeInstanceOf(InvalidDatetimeError)
		expect(crossDay.value.message).toBe('startsAt and endsAt must be on the same day')
		expect(future.value).toBeInstanceOf(InvalidDatetimeError)
		expect(future.value.message).toBe('endsAt cannot be in the future')
	})

	it('should switch optional relations while preserving omitted content', async () => {
		await categoriesRepository.create(
			makeCategory({ userId: new UniqueEntityID('user-1') }, new UniqueEntityID('category-1')),
		)
		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-1'),
					taskId: new UniqueEntityID('task-1'),
					title: 'Original title',
					description: 'Original description',
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('work-log-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			taskId: null,
			categoryId: 'category-1',
			timeZone: 'UTC',
		})

		expect(result.isRight()).toBe(true)
		expect(workLogsRepository.items[0].taskId).toBeNull()
		expect(workLogsRepository.items[0].categoryId?.toString()).toBe('category-1')
		expect(workLogsRepository.items[0].title).toBe('Original title')
		expect(workLogsRepository.items[0].description).toBe('Original description')

		const withoutOptionalChanges = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			timeZone: 'UTC',
		})

		expect(withoutOptionalChanges.isRight()).toBe(true)
	})

	it('should detect another overlapping work log when the edited item comes first', async () => {
		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T08:00:00.000Z'),
					endsAt: new Date('2026-01-12T09:00:00.000Z'),
				},
				new UniqueEntityID('work-log-1'),
			),
		)
		await workLogsRepository.create(
			makeWorkLog({
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-12T10:00:00.000Z'),
				endsAt: new Date('2026-01-12T11:00:00.000Z'),
			}),
		)

		const result = await sut.execute({
			userId: 'user-1',
			workLogId: 'work-log-1',
			startsAt: new Date('2026-01-12T09:30:00.000Z'),
			endsAt: new Date('2026-01-12T10:30:00.000Z'),
			timeZone: 'UTC',
		})

		expect(result.value).toBeInstanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('The work log interval overlaps an existing work log')
		expect(workLogsRepository.items[0].startsAt).toEqual(new Date('2026-01-12T08:00:00.000Z'))
	})
})
