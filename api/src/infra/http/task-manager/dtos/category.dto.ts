import { ApiProperty } from '@nestjs/swagger'

export class CategoryDto {
	@ApiProperty()
	id!: string

	@ApiProperty({
		example: 'Meeting',
	})
	name!: string

	@ApiProperty()
	color!: string
}
