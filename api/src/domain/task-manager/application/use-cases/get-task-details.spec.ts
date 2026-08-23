import { makePlan } from 'test/unit/factories/make-plan'
import { makeTask } from 'test/unit/factories/make-tasks'
import { makeWorkLog } from 'test/unit/factories/make-work-logs'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { GetTaskDetailsUseCase } from './get-task-details'

let tasksRepository: InMemoryTasksRepository
let plansRepository: InMemoryPlansRepository
let workLogsRepository: InMemoryWorkLogsRepository
let sut: GetTaskDetailsUseCase

describe('Get task details [USE CASE]', () => {
	beforeEach(() => {
		tasksRepository = new InMemoryTasksRepository()
		plansRepository = new InMemoryPlansRepository()
		workLogsRepository = new InMemoryWorkLogsRepository()
		sut = new GetTaskDetailsUseCase(tasksRepository, plansRepository, workLogsRepository)
	})

	it('should return totals and combined owned activity in deterministic order', async () => {
		const task = makeTask(
			{ userId: new UniqueEntityID('user-1'), title: 'Release' },
			new UniqueEntityID('task-1'),
		)

		await tasksRepository.create(task)
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					taskId: task.id,
					title: 'Latest confirmed plan',
					startsAt: new Date('2026-08-23T12:00:00.000Z'),
					endsAt: new Date('2026-08-23T13:00:00.000Z'),
					confirmedAt: new Date('2026-08-23T13:00:00.000Z'),
				},
				new UniqueEntityID('plan-2'),
			),
		)
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					taskId: task.id,
					title: 'Tied plan',
					startsAt: new Date('2026-08-23T10:00:00.000Z'),
					endsAt: new Date('2026-08-23T10:30:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)
		await workLogsRepository.create(
			makeWorkLog(
				{
					userId: new UniqueEntityID('user-1'),
					taskId: task.id,
					title: 'Tied work log',
					startsAt: new Date('2026-08-23T10:00:00.000Z'),
					endsAt: new Date('2026-08-23T10:45:00.000Z'),
				},
				new UniqueEntityID('work-log-1'),
			),
		)

		await plansRepository.create(
			makePlan({
				userId: new UniqueEntityID('user-1'),
				taskId: new UniqueEntityID('other-task'),
				startsAt: new Date('2026-08-23T14:00:00.000Z'),
				endsAt: new Date('2026-08-23T15:00:00.000Z'),
			}),
		)
		await workLogsRepository.create(
			makeWorkLog({
				userId: new UniqueEntityID('user-2'),
				taskId: task.id,
				startsAt: new Date('2026-08-23T14:00:00.000Z'),
				endsAt: new Date('2026-08-23T15:00:00.000Z'),
			}),
		)

		const result = await sut.execute({ userId: 'user-1', taskId: 'task-1' })

		expect(result.isRight()).toBe(true)
		expect(result.value?.data.task).toEqual(task)
		expect(result.value?.data.summary).toEqual({ plannedMinutes: 90, loggedMinutes: 45 })
		expect(result.value?.data.activity.map((entry) => entry.id.toString())).toEqual([
			'plan-2',
			'plan-1',
			'work-log-1',
		])
		expect(result.value?.data.activity[0]).toMatchObject({
			kind: 'plan',
			isConfirmed: true,
		})
		expect(result.value?.data.activity[1]).toMatchObject({
			kind: 'plan',
			isConfirmed: false,
		})
		expect(result.value?.data.activity[2]).not.toHaveProperty('isConfirmed')
	})

	it('should return an empty history', async () => {
		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-1') },
				new UniqueEntityID('task-1'),
			),
		)

		const result = await sut.execute({ userId: 'user-1', taskId: 'task-1' })

		expect(result.value?.data.summary).toEqual({ plannedMinutes: 0, loggedMinutes: 0 })
		expect(result.value?.data.activity).toEqual([])
	})

	it('should clamp invalid stored durations and break same-kind ties by id', async () => {
		const task = makeTask(
			{ userId: new UniqueEntityID('user-1') },
			new UniqueEntityID('task-1'),
		)

		await tasksRepository.create(task)

		for (const planId of ['plan-2', 'plan-1']) {
			await plansRepository.create(
				makePlan(
					{
						userId: new UniqueEntityID('user-1'),
						taskId: task.id,
						startsAt: new Date('2026-08-23T10:00:00.000Z'),
						endsAt: new Date('2026-08-23T09:00:00.000Z'),
					},
					new UniqueEntityID(planId),
				),
			)
		}

		const result = await sut.execute({ userId: 'user-1', taskId: 'task-1' })

		expect(result.value?.data.summary.plannedMinutes).toBe(0)
		expect(result.value?.data.activity.map((entry) => entry.id.toString())).toEqual([
			'plan-1',
			'plan-2',
		])
	})

	it('should reject a missing task without fetching related history', async () => {
		const fetchPlans = vi.spyOn(plansRepository, 'fetchAllByTaskId')
		const fetchWorkLogs = vi.spyOn(workLogsRepository, 'fetchAllByTaskId')

		const result = await sut.execute({ userId: 'user-1', taskId: 'missing-task' })

		expect(result.value).toBeInstanceOf(ResourceNotFoundError)
		expect(fetchPlans).not.toHaveBeenCalled()
		expect(fetchWorkLogs).not.toHaveBeenCalled()
	})

	it('should reject another user task without fetching related history', async () => {
		await tasksRepository.create(
			makeTask(
				{ userId: new UniqueEntityID('user-2') },
				new UniqueEntityID('task-1'),
			),
		)
		const fetchPlans = vi.spyOn(plansRepository, 'fetchAllByTaskId')
		const fetchWorkLogs = vi.spyOn(workLogsRepository, 'fetchAllByTaskId')

		const result = await sut.execute({ userId: 'user-1', taskId: 'task-1' })

		expect(result.value).toBeInstanceOf(NotAllowedError)
		expect(fetchPlans).not.toHaveBeenCalled()
		expect(fetchWorkLogs).not.toHaveBeenCalled()
	})
})
