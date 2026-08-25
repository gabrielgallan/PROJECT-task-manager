import { makePlan } from 'test/unit/factories/make-plan'
import { makeWorkLog } from 'test/unit/factories/make-work-logs'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryWorkLogsRepository } from 'test/unit/repositories/in-memory-work-logs-repository'
import { makeInMemoryTaskManagerRepositories } from 'test/unit/repositories/make-in-memory-task-manager-repositories'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { ConfirmPlanUseCase } from './confirm-plan'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'
import { InvalidTimeZoneError } from './errors/invalid-time-zone-error'
import { PlanAlreadyConfirmedError } from './errors/plan-already-confirmed-error'

let plansRepository: InMemoryPlansRepository
let workLogsRepository: InMemoryWorkLogsRepository

let sut: ConfirmPlanUseCase

describe('Confirm plan [USE CASE]', () => {
	beforeEach(() => {
		;({ plansRepository, workLogsRepository } = makeInMemoryTaskManagerRepositories())

		sut = new ConfirmPlanUseCase(plansRepository, workLogsRepository)
	})

	it('should be able to confirm a plan', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					title: 'Daily Standup - Authentication Integration',
					description:
						'Discussed session authentication progress, current blockers, and the next steps for frontend integration.',
					startsAt: new Date(2026, 0, 12, 9, 0, 0),
					endsAt: new Date(2026, 0, 12, 9, 30, 0),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			timeZone: 'UTC',
		})

		expect(workLogsRepository.items).toHaveLength(1)
		expect(workLogsRepository.items[0].userId.toString()).toBe('user-1')
		expect(workLogsRepository.items[0].taskId).toBeNull()
		expect(workLogsRepository.items[0].categoryId).toBeNull()
		expect(workLogsRepository.items[0].title).toBe('Daily Standup - Authentication Integration')
		expect(workLogsRepository.items[0].description).toBe(
			'Discussed session authentication progress, current blockers, and the next steps for frontend integration.',
		)
		expect(workLogsRepository.items[0].startsAt).toEqual(new Date(2026, 0, 12, 9, 0, 0))
		expect(workLogsRepository.items[0].endsAt).toEqual(new Date(2026, 0, 12, 9, 30, 0))
		expect(plansRepository.items[0].confirmedAt).toBeTruthy()
	})

	it('should reject an already confirmed plan without side effects', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T09:00:00.000Z'),
					endsAt: new Date('2026-01-12T10:00:00.000Z'),
					confirmedAt: new Date('2026-01-12T10:00:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)
		const createWorkLogSpy = vi.spyOn(workLogsRepository, 'create')
		const savePlanSpy = vi.spyOn(plansRepository, 'save')

		const result = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			timeZone: 'UTC',
		})

		expect(result.value).toBeInstanceOf(PlanAlreadyConfirmedError)
		expect(createWorkLogSpy).not.toHaveBeenCalled()
		expect(savePlanSpy).not.toHaveBeenCalled()
		expect(workLogsRepository.items).toHaveLength(0)
	})

	it('should reject an invalid IANA time zone before accessing repositories', async () => {
		const findByIdSpy = vi.spyOn(plansRepository, 'findById')

		const result = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			timeZone: 'Invalid/TimeZone',
		})

		expect(result.value).toBeInstanceOf(InvalidTimeZoneError)
		expect(findByIdSpy).not.toHaveBeenCalled()
	})

	it('should reject a plan that crosses the user calendar day', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T02:30:00.000Z'),
					endsAt: new Date('2026-01-12T03:30:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			timeZone: 'America/Sao_Paulo',
		})

		expect(result.value).toBeInstanceOf(InvalidDatetimeError)
		expect(workLogsRepository.items).toHaveLength(0)
		expect(plansRepository.items[0].confirmedAt).toBeNull()
	})

	it('should reject a plan with an invalid interval', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T10:00:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			timeZone: 'UTC',
		})

		expect(result.value).toBeInstanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('endsAt must be after startsAt')
		expect(workLogsRepository.items).toHaveLength(0)
	})

	it('should reject a plan ending in the future', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2100-01-12T10:00:00.000Z'),
					endsAt: new Date('2100-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			timeZone: 'UTC',
		})

		expect(result.value).toBeInstanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('endsAt cannot be in the future')
		expect(workLogsRepository.items).toHaveLength(0)
	})

	it('should reject a plan overlapping an existing work log', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					startsAt: new Date('2026-01-12T10:00:00.000Z'),
					endsAt: new Date('2026-01-12T11:00:00.000Z'),
				},
				new UniqueEntityID('plan-1'),
			),
		)
		await workLogsRepository.create(
			makeWorkLog({
				userId: new UniqueEntityID('user-1'),
				startsAt: new Date('2026-01-12T10:30:00.000Z'),
				endsAt: new Date('2026-01-12T11:30:00.000Z'),
			}),
		)

		const result = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			timeZone: 'UTC',
		})

		expect(result.value).toBeInstanceOf(InvalidDatetimeError)
		expect(result.value.message).toBe('The work log interval overlaps an existing work log')
		expect(workLogsRepository.items).toHaveLength(1)
		expect(plansRepository.items[0].confirmedAt).toBeNull()
	})

	it('should reject a plan doesnt exists', async () => {
		const result = await sut.execute({
			userId: 'user-1',
			planId: 'plan-1',
			timeZone: 'UTC',
		})

		expect(result.value).instanceOf(ResourceNotFoundError)
	})

	it('should reject a plan from another user', async () => {
		await plansRepository.create(
			makePlan(
				{
					userId: new UniqueEntityID('user-1'),
					title: 'Daily Standup - Authentication Integration',
					description:
						'Discussed session authentication progress, current blockers, and the next steps for frontend integration.',
					startsAt: new Date(2026, 0, 12, 9, 0, 0),
					endsAt: new Date(2026, 0, 12, 9, 30, 0),
				},
				new UniqueEntityID('plan-1'),
			),
		)

		const result = await sut.execute({
			userId: 'user-2',
			planId: 'plan-1',
			timeZone: 'UTC',
		})

		expect(result.value).instanceOf(NotAllowedError)
	})
})
