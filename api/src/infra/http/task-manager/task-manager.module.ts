import { Module } from '@nestjs/common'
import { CreateCategoryUseCase } from '@/domain/task-manager/application/use-cases/create-category'
import { CreateTaskUseCase } from '@/domain/task-manager/application/use-cases/create-task'
import { DeleteCategoryUseCase } from '@/domain/task-manager/application/use-cases/delete-category'
import { DeleteTaskUseCase } from '@/domain/task-manager/application/use-cases/delete-task'
import { EditCategoryUseCase } from '@/domain/task-manager/application/use-cases/edit-category'
import { EditTaskUseCase } from '@/domain/task-manager/application/use-cases/edit-task'
import {
	FetchCategoriesUseCase,
} from '@/domain/task-manager/application/use-cases/fetch-categories'
import {
	FetchTaskOptionsUseCase,
} from '@/domain/task-manager/application/use-cases/fetch-task-options'
import { FetchTasksUseCase } from '@/domain/task-manager/application/use-cases/fetch-tasks'
import {
	GetCategoryDeletionImpactUseCase,
} from '@/domain/task-manager/application/use-cases/get-category-deletion-impact'
import { GetTaskDetailsUseCase } from '@/domain/task-manager/application/use-cases/get-task-details'
import { DatabaseModule } from '@/infra/database/database.module'
import { CreateCategoryController } from './controllers/create-category.controller'
import { CreateTaskController } from './controllers/create-task.controller'
import { DeleteCategoryController } from './controllers/delete-category.controller'
import { DeleteTaskController } from './controllers/delete-task.controller'
import { EditCategoryController } from './controllers/edit-category.controller'
import { EditTaskController } from './controllers/edit-task.controller'
import { FetchCategoriesController } from './controllers/fetch-categories.controller'
import { FetchTaskOptionsController } from './controllers/fetch-task-options.controller'
import { FetchTasksController } from './controllers/fetch-tasks.controller'
import {
	GetCategoryDeletionImpactController,
} from './controllers/get-category-deletion-impact.controller'
import { GetTaskDetailsController } from './controllers/get-task-details.controller'

@Module({
	imports: [DatabaseModule],
	controllers: [
		FetchTaskOptionsController,
		GetTaskDetailsController,
		FetchTasksController,
		CreateTaskController,
		EditTaskController,
		DeleteTaskController,
		FetchCategoriesController,
		CreateCategoryController,
		EditCategoryController,
		DeleteCategoryController,
		GetCategoryDeletionImpactController,
	],
	providers: [
		FetchTaskOptionsUseCase,
		GetTaskDetailsUseCase,
		FetchTasksUseCase,
		CreateTaskUseCase,
		EditTaskUseCase,
		DeleteTaskUseCase,
		FetchCategoriesUseCase,
		CreateCategoryUseCase,
		EditCategoryUseCase,
		DeleteCategoryUseCase,
		GetCategoryDeletionImpactUseCase,
	],
})
export class TaskManagerModule {}
