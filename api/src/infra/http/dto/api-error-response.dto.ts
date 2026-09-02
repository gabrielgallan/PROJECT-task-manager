import { ApiProperty } from '@nestjs/swagger'

export class ApiErrorResponseDto {
	@ApiProperty({
		description: 'HTTP status code',
	})
	statusCode!: number

	@ApiProperty({
		description: 'HTTP error description',
	})
	message!: string

	@ApiProperty({
		example: {},
	})
	error!: unknown
}
