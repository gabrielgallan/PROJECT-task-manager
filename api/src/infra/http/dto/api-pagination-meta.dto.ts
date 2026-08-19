import { ApiProperty } from '@nestjs/swagger'

export class ApiPaginationMetaDto {
	@ApiProperty({
		example: 10,
	})
	limit!: number

	@ApiProperty({
		example: 1,
	})
	page!: number

	@ApiProperty({
		example: 35,
	})
	total!: number
}
