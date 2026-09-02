import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const editTaskScheduleParamSchema = z.object({
	taskId: z.uuid(),
})

export class EditTaskScheduleParamDto extends createZodDto(editTaskScheduleParamSchema) {}

export const editTaskScheduleSchema = z.object({
	startDate: z.iso.date().nullish(),
	dueDate: z.iso.date().nullish(),
})

export class EditTaskScheduleDto extends createZodDto(editTaskScheduleSchema) {}
