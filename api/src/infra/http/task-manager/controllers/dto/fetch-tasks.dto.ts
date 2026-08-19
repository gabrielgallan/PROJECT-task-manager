import { ApiProperty } from '@nestjs/swagger'
import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { PaginationMetaDto } from '@/infra/http/dto/pagination-meta.dto'
import { TaskDto } from '../../dtos/task.dto'

const taskStatusSchema = z.enum(['BACKLOG', 'IN_PROGRESS', 'DONE'])

const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

const taskSortBySchema = z.enum(['title', 'status', 'priority', 'updatedAt', 'dueDate'])

export const fetchTasksSchema = z.object({
	search: z.string().optional(),
	status: z
		.union([taskStatusSchema, z.array(taskStatusSchema)])
		.transform((value) => (Array.isArray(value) ? value : [value]))
		.optional(),
	priority: z
		.union([taskPrioritySchema, z.array(taskPrioritySchema)])
		.transform((value) => (Array.isArray(value) ? value : [value]))
		.optional(),
	limit: z.coerce.number().int().positive().max(200).optional(),
	page: z.coerce.number().int().positive().optional(),
	sortBy: taskSortBySchema.optional(),
	sortDir: z.enum(['asc', 'desc']).optional(),
})

export class FetchTasksDto extends createZodDto(fetchTasksSchema) {}

export class FetchTasksResponseDto {
	@ApiProperty({
		type: TaskDto,
		isArray: true,
	})
	data!: TaskDto[]

	@ApiProperty({
		type: PaginationMetaDto,
		required: false,
	})
	meta!: PaginationMetaDto | undefined
}
