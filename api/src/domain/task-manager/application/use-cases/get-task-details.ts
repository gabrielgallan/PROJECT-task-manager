import { Injectable } from '@nestjs/common'
import { differenceInMinutes } from 'date-fns'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import type { Task } from '../../enterprise/entities/task'
import { PlansRepository } from '../repositories/plans-repository'
import { TasksRepository } from '../repositories/tasks-repository'
import { WorkLogsRepository } from '../repositories/work-logs-repository'

type GetTaskDetailsUseCaseRequest = {
	userId: string
	taskId: string
}

export type TaskActivityEntry =
	| {
			id: UniqueEntityID
			kind: 'plan'
			title: string
			startsAt: Date
			endsAt: Date
			isConfirmed: boolean
	}
	| {
			id: UniqueEntityID
			kind: 'work-log'
			title: string
			startsAt: Date
			endsAt: Date
	}

export type TaskDetails = {
	task: Task
	summary: {
		plannedMinutes: number
		loggedMinutes: number
	}
	activity: TaskActivityEntry[]
}

type GetTaskDetailsUseCaseResponse = Either<
	ResourceNotFoundError | NotAllowedError,
	{ data: TaskDetails }
>

@Injectable()
export class GetTaskDetailsUseCase {
	constructor(
		private tasksRepository: TasksRepository,
		private plansRepository: PlansRepository,
		private workLogsRepository: WorkLogsRepository,
	) {}

	async execute({
		userId,
		taskId,
	}: GetTaskDetailsUseCaseRequest): Promise<GetTaskDetailsUseCaseResponse> {
		const task = await this.tasksRepository.findById(taskId)

		if (!task) {
			return left(new ResourceNotFoundError())
		}

		if (task.userId.toString() !== userId) {
			return left(new NotAllowedError())
		}

		const [plans, workLogs] = await Promise.all([
			this.plansRepository.fetchAllByTaskId(userId, taskId),
			this.workLogsRepository.fetchAllByTaskId(userId, taskId),
		])

		const activity: TaskActivityEntry[] = [
			...plans.map((plan) => ({
				id: plan.id,
				kind: 'plan' as const,
				title: plan.title,
				startsAt: plan.startsAt,
				endsAt: plan.endsAt,
				isConfirmed: Boolean(plan.confirmedAt),
			})),
			...workLogs.map((workLog) => ({
				id: workLog.id,
				kind: 'work-log' as const,
				title: workLog.title,
				startsAt: workLog.startsAt,
				endsAt: workLog.endsAt,
			})),
		].sort(compareActivity)

		return right({
			data: {
				task,
				summary: {
					plannedMinutes: sumMinutes(plans),
					loggedMinutes: sumMinutes(workLogs),
				},
				activity,
			},
		})
	}
}

function sumMinutes(intervals: Array<{ startsAt: Date; endsAt: Date }>) {
	return intervals.reduce(
		(total, interval) =>
			total + Math.max(0, differenceInMinutes(interval.endsAt, interval.startsAt)),
		0,
	)
}

function compareActivity(a: TaskActivityEntry, b: TaskActivityEntry) {
	const startsAtComparison = b.startsAt.getTime() - a.startsAt.getTime()

	if (startsAtComparison !== 0) return startsAtComparison
	if (a.kind !== b.kind) return a.kind === 'plan' ? -1 : 1

	return a.id.toString().localeCompare(b.id.toString())
}
