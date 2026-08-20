import { makeCategory } from 'test/unit/factories/make-category'
import { makeTask } from 'test/unit/factories/make-tasks'
import { InMemoryCategoriesRepository } from 'test/unit/repositories/in-memory-categories-repository'
import { InMemoryPlansRepository } from 'test/unit/repositories/in-memory-plans-repository'
import { InMemoryTasksRepository } from 'test/unit/repositories/in-memory-tasks-repository'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/shared/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/shared/errors/resource-not-found-error'
import { CreatePlanUseCase } from './create-plan'
import { InvalidDatetimeError } from './errors/invalid-datetime-error'
import { EditPlanUseCase } from './edit-plan'

let plansRepository: InMemoryPlansRepository
let tasksRepository: InMemoryTasksRepository
let categoriesRepository: InMemoryCategoriesRepository

let sut: EditPlanUseCase

describe('Edit plan [USE CASE]', () => {
    beforeEach(() => {
        plansRepository = new InMemoryPlansRepository()
        tasksRepository = new InMemoryTasksRepository()
        categoriesRepository = new InMemoryCategoriesRepository()

        sut = new EditPlanUseCase(plansRepository, tasksRepository, categoriesRepository)
    })

    it('should be able to edit a plan', async () => {
        
    })
})
