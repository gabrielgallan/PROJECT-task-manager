import { Module } from '@nestjs/common'
import { FetchTasksController } from './controllers/fetch-tasks.controller'

@Module({
	imports: [],
	controllers: [FetchTasksController],
	providers: [],
})
export class TaskManagerModule {}
