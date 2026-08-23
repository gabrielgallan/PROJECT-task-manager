import { Injectable } from '@nestjs/common'
import { isAfter, isFuture } from 'date-fns'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { isSameCalendarDay, isValidTimeZone } from '@/core/utils/time-zone'
import { WorkLog } from '../../enterprise/entities/work-log'
import { PlansRepository } from '../repositories/plans-repository'
import { WorkLogsRepository } from '../repositories/work-logs-repository'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'
import { InvalidTimeZoneError } from './errors/invalid-time-zone-error'
import { PlanAlreadyConfirmedError } from './errors/plan-already-confirmed-error'

type ConfirmPlanUseCaseRequest = {
	userId: string
	planId: string
	timeZone: string
}

type ConfirmPlanUseCaseResponse = Either<
	| ResourceNotFoundError
	| NotAllowedError
	| InvalidDatetimeError
	| InvalidTimeZoneError
	| PlanAlreadyConfirmedError,
	null
>

@Injectable()
export class ConfirmPlanUseCase {
	constructor(
		private plansRepository: PlansRepository,
		private workLogsRepository: WorkLogsRepository,
	) {}

	async execute({
		userId,
		planId,
		timeZone,
	}: ConfirmPlanUseCaseRequest): Promise<ConfirmPlanUseCaseResponse> {
		if (!isValidTimeZone(timeZone)) {
			return left(new InvalidTimeZoneError())
		}

		const plan = await this.plansRepository.findById(planId)

		if (!plan) {
			return left(new ResourceNotFoundError())
		}

		if (plan.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		if (plan.confirmedAt) {
			return left(new PlanAlreadyConfirmedError())
		}

		const startsAt = plan.startsAt

		const endsAt = plan.endsAt

		if (!isAfter(endsAt, startsAt)) {
			return left(new InvalidDatetimeError('endsAt must be after startsAt'))
		}

		if (!isSameCalendarDay(startsAt, endsAt, timeZone)) {
			return left(new InvalidDatetimeError('startsAt and endsAt must be on the same day'))
		}

		if (isFuture(endsAt)) {
			return left(new InvalidDatetimeError('endsAt cannot be in the future'))
		}

		const overlappingWorkLog = await this.workLogsRepository.findByUserIdOverlapping(
			userId,
			startsAt,
			endsAt,
		)

		if (overlappingWorkLog) {
			return left(new InvalidDatetimeError('The work log interval overlaps an existing work log'))
		}

		plan.confirm()

		const workLog = WorkLog.create({
			userId: plan.userId,
			taskId: plan.taskId,
			categoryId: plan.categoryId,
			title: plan.title,
			description: plan.description,
			startsAt,
			endsAt,
		})

		await this.workLogsRepository.create(workLog)

		await this.plansRepository.save(plan)

		return right(null)
	}
}
