import { ApiProperty } from '@nestjs/swagger'

export class TaskOptionDto {
	@ApiProperty({
		example: 'task-uuid',
	})
	id!: string

	@ApiProperty({
		example: 'Implement new feature',
	})
	title!: string
}
