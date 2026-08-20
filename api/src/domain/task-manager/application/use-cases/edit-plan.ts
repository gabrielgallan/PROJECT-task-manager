import { Injectable } from '@nestjs/common'
import { isAfter } from 'date-fns'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { type Either, left, right } from '@/core/types/either'
import { Plan } from '../../enterprise/entities/plan'
import { CategoriesRepository } from '../repositories/categories-repository'
import { PlansRepository } from '../repositories/plans-repository'
import { TasksRepository } from '../repositories/tasks-repository'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'

type EditPlanUseCaseRequest = {
    userId: string
    planId: string
    taskId?: string | null
    categoryId?: string | null
    title?: string
    description?: string | null
    startsAt?: Date
    endsAt?: Date
}

type EditPlanUseCaseResponse = Either<
    ResourceNotFoundError | NotAllowedError | InvalidDatetimeError,
    { plan: Plan }
>

@Injectable()
export class EditPlanUseCase {
    constructor(
        private plansRepository: PlansRepository,
        private tasksRepository: TasksRepository,
        private categoriesRepository: CategoriesRepository,
    ) {}

    async execute({
        userId,
        planId,
        taskId,
        categoryId,
        title,
        description,
        startsAt,
        endsAt,
    }: EditPlanUseCaseRequest): Promise<EditPlanUseCaseResponse> {
        const plan = await this.plansRepository.findById(planId)

        if (!plan) {
            return left(new ResourceNotFoundError())
        }

        if (plan.userId.toString() !== userId) {
            return left(new NotAllowedError())
        }

        if (taskId) {
            const task = await this.tasksRepository.findById(taskId)

            if (!task) return left(new ResourceNotFoundError())

            if (task.userId.toString() !== userId) return left(new NotAllowedError())
        
            plan.taskId = new UniqueEntityID(taskId)
        } else if (taskId === null) {
            plan.taskId = null
        }

        if (categoryId) {
            const category = await this.categoriesRepository.findById(categoryId)

            if (!category) return left(new ResourceNotFoundError())

            if (category.userId.toString() !== userId) return left(new NotAllowedError())
        
        } else if (categoryId === null) {
            plan.categoryId === null
        }

        if (title) plan.title = title

        if (description !== undefined) plan.description = description

        const newStartsAt = startsAt ?? plan.startsAt
        
        const newEndsAt = endsAt ?? plan.endsAt

        if (!isAfter(newEndsAt, newStartsAt)) {
			return left(new InvalidDatetimeError('endsAt must be after startsAt'))
		}

        plan.startsAt = newStartsAt

        plan.endsAt = newEndsAt

        await this.plansRepository.save(plan)

        return right({ plan })
    }
}
