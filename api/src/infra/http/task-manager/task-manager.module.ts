import { Module } from '@nestjs/common'
import { CreateCategoryUseCase } from '@/domain/task-manager/application/use-cases/create-category'
import { CreateTaskUseCase } from '@/domain/task-manager/application/use-cases/create-task'
import { ConfirmPlanUseCase } from '@/domain/task-manager/application/use-cases/confirm-plan'
import { CreatePlanUseCase } from '@/domain/task-manager/application/use-cases/create-plan'
import { CreateWorkLogUseCase } from '@/domain/task-manager/application/use-cases/create-work-log'
import { DeleteCategoryUseCase } from '@/domain/task-manager/application/use-cases/delete-category'
import { DeleteTaskUseCase } from '@/domain/task-manager/application/use-cases/delete-task'
import { DeletePlanUseCase } from '@/domain/task-manager/application/use-cases/delete-plan'
import { DeleteWorkLogUseCase } from '@/domain/task-manager/application/use-cases/delete-work-log'
import { EditCategoryUseCase } from '@/domain/task-manager/application/use-cases/edit-category'
import { EditTaskUseCase } from '@/domain/task-manager/application/use-cases/edit-task'
import { EditPlanUseCase } from '@/domain/task-manager/application/use-cases/edit-plan'
import { EditWorkLogUseCase } from '@/domain/task-manager/application/use-cases/edit-work-log'
import { FetchCategoriesUseCase } from '@/domain/task-manager/application/use-cases/fetch-categories'
import { FetchPlansUseCase } from '@/domain/task-manager/application/use-cases/fetch-plans'
import { FetchTaskOptionsUseCase } from '@/domain/task-manager/application/use-cases/fetch-task-options'
import { FetchTasksUseCase } from '@/domain/task-manager/application/use-cases/fetch-tasks'
import { FetchWorkLogsUseCase } from '@/domain/task-manager/application/use-cases/fetch-work-logs'
import { GetCategoryDeletionImpactUseCase } from '@/domain/task-manager/application/use-cases/get-category-deletion-impact'
import { GetTaskDetailsUseCase } from '@/domain/task-manager/application/use-cases/get-task-details'
import { DatabaseModule } from '@/infra/database/database.module'
import { CreateCategoryController } from './controllers/create-category.controller'
import { CreateTaskController } from './controllers/create-task.controller'
import { ConfirmPlanController } from './controllers/confirm-plan.controller'
import { CreatePlanController } from './controllers/create-plan.controller'
import { CreateWorkLogController } from './controllers/create-work-log.controller'
import { DeleteCategoryController } from './controllers/delete-category.controller'
import { DeleteTaskController } from './controllers/delete-task.controller'
import { DeletePlanController } from './controllers/delete-plan.controller'
import { DeleteWorkLogController } from './controllers/delete-work-log.controller'
import { EditCategoryController } from './controllers/edit-category.controller'
import { EditTaskScheduleController } from './controllers/edit-task-schedule.controller'
import { EditTaskStatusController } from './controllers/edit-task-status.controller'
import { EditTaskController } from './controllers/edit-task.controller'
import { EditPlanScheduleController } from './controllers/edit-plan-schedule.controller'
import { EditPlanController } from './controllers/edit-plan.controller'
import { EditWorkLogScheduleController } from './controllers/edit-work-log-schedule.controller'
import { EditWorkLogController } from './controllers/edit-work-log.controller'
import { FetchCategoriesController } from './controllers/fetch-categories.controller'
import { FetchPlansController } from './controllers/fetch-plans.controller'
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
		EditWorkLogScheduleController,
		DeleteWorkLogController,
		FetchPlansController,
		CreatePlanController,
		EditPlanController,
		EditPlanScheduleController,
		DeletePlanController,
		ConfirmPlanController,
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
		FetchPlansUseCase,
		CreatePlanUseCase,
		EditPlanUseCase,
		DeletePlanUseCase,
		ConfirmPlanUseCase,
	],
})
export class TaskManagerModule {}
