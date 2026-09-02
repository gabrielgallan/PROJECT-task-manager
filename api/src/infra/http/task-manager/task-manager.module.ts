import { Module } from '@nestjs/common'
import { CreateCategoryUseCase } from '@/domain/task-manager/application/use-cases/create-category'
import { CreateTaskUseCase } from '@/domain/task-manager/application/use-cases/create-task'
import { CreateWorkLogUseCase } from '@/domain/task-manager/application/use-cases/create-work-log'
import { DeleteCategoryUseCase } from '@/domain/task-manager/application/use-cases/delete-category'
import { DeleteTaskUseCase } from '@/domain/task-manager/application/use-cases/delete-task'
import { DeleteWorkLogUseCase } from '@/domain/task-manager/application/use-cases/delete-work-log'
import { EditCategoryUseCase } from '@/domain/task-manager/application/use-cases/edit-category'
import { EditTaskUseCase } from '@/domain/task-manager/application/use-cases/edit-task'
import { EditWorkLogUseCase } from '@/domain/task-manager/application/use-cases/edit-work-log'
import { FetchCategoriesUseCase } from '@/domain/task-manager/application/use-cases/fetch-categories'
import { FetchTaskOptionsUseCase } from '@/domain/task-manager/application/use-cases/fetch-task-options'
import { FetchTasksUseCase } from '@/domain/task-manager/application/use-cases/fetch-tasks'
import { FetchWorkLogsUseCase } from '@/domain/task-manager/application/use-cases/fetch-work-logs'
import { GetCategoryDeletionImpactUseCase } from '@/domain/task-manager/application/use-cases/get-category-deletion-impact'
import { GetTaskDetailsUseCase } from '@/domain/task-manager/application/use-cases/get-task-details'
import { DatabaseModule } from '@/infra/database/database.module'
import { CreateCategoryController } from './controllers/create-category.controller'
import { CreateTaskController } from './controllers/create-task.controller'
import { CreateWorkLogController } from './controllers/create-work-log.controller'
import { DeleteCategoryController } from './controllers/delete-category.controller'
import { DeleteTaskController } from './controllers/delete-task.controller'
import { DeleteWorkLogController } from './controllers/delete-work-log.controller'
import { EditCategoryController } from './controllers/edit-category.controller'
import { EditTaskScheduleController } from './controllers/edit-task-schedule.controller'
import { EditTaskStatusController } from './controllers/edit-task-status.controller'
import { EditTaskController } from './controllers/edit-task.controller'
import { EditWorkLogController } from './controllers/edit-work-log.controller'
import { FetchCategoriesController } from './controllers/fetch-categories.controller'
import { FetchTaskOptionsController } from './controllers/fetch-task-options.controller'
import { FetchTasksController } from './controllers/fetch-tasks.controller'
import { FetchWorkLogsController } from './controllers/fetch-work-logs.controller'
import { GetCategoryDeletionImpactController } from './controllers/get-category-deletion-impact.controller'
import { GetTaskDetailsController } from './controllers/get-task-details.controller'

@Module({
	imports: [DatabaseModule],
	controllers: [
		FetchTaskOptionsController,
		GetTaskDetailsController,
		FetchTasksController,
		CreateTaskController,
		EditTaskController,
		EditTaskStatusController,
		EditTaskScheduleController,
		DeleteTaskController,
		FetchCategoriesController,
		CreateCategoryController,
		EditCategoryController,
		DeleteCategoryController,
		GetCategoryDeletionImpactController,
		CreateWorkLogController,
		FetchWorkLogsController,
		EditWorkLogController,
		DeleteWorkLogController,
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
		CreateWorkLogUseCase,
		FetchWorkLogsUseCase,
		EditWorkLogUseCase,
		DeleteWorkLogUseCase,
	],
})
export class TaskManagerModule {}
