import { z } from 'zod'

export const taskIdSchema = z.uuid()
export const taskStatusSchema = z.enum(['BACKLOG', 'IN_PROGRESS', 'DONE'], {
	error: 'Select a valid status',
})
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
	error: 'Select a valid priority',
})
export const taskScheduleSchema = z.object({
	startDate: z.iso.date('Enter a valid start date').nullable(),
	dueDate: z.iso.date('Enter a valid due date').nullable(),
})
export const taskStatusFormSchema = z.object({ status: taskStatusSchema })
export const taskFormSchema = taskScheduleSchema.extend({
	title: z.string().trim().min(1, 'Title is required'),
	description: z.string().trim(),
	status: taskStatusSchema,
	priority: taskPrioritySchema,
})
export const taskFiltersSchema = z.object({
	search: z.string().trim(),
	status: z.array(taskStatusSchema),
	priority: z.array(taskPrioritySchema),
})
export const taskOptionsSearchSchema = z.object({
	q: z.string().trim().max(100, 'Search must be 100 characters or less'),
})
export const taskOptionsRequestSchema = taskOptionsSearchSchema.partial().extend({
	limit: z.number().int().min(1).max(50).optional(),
	cursor: z.string().min(1).max(1000).optional(),
})
export const taskListRequestSchema = z.object({
	search: z.string().optional(),
	status: z.union([taskStatusSchema, z.array(taskStatusSchema)]).optional(),
	priority: z.union([taskPrioritySchema, z.array(taskPrioritySchema)]).optional(),
	page: z.number().int().positive().optional(),
	limit: z.number().int().positive().max(200).optional(),
	sortBy: z.enum(['title', 'status', 'priority', 'updatedAt', 'dueDate']).optional(),
	sortDir: z.enum(['asc', 'desc']).optional(),
}).refine((v) => (v.page === undefined) === (v.limit === undefined), 'Invalid pagination')
	.refine((v) => (v.sortBy === undefined) === (v.sortDir === undefined), 'Invalid sort')

export type TaskFormValues = z.infer<typeof taskFormSchema>
export type TaskScheduleValues = z.infer<typeof taskScheduleSchema>
export type TaskStatusValues = z.infer<typeof taskStatusFormSchema>
export type TaskOptionsSearchValues = z.infer<typeof taskOptionsSearchSchema>
