import { ApiProperty } from '@nestjs/swagger'

export class ApiErrorResponseDto {
	@ApiProperty({
		example: 400,
		description: 'HTTP status code',
	})
	statusCode!: number

	@ApiProperty({
		example: 'Invalid request data',
		description: 'HTTP error description',
	})
	message!: string

	@ApiProperty({
		example: 'Bad Request',
		description: 'HTTP error',
	})
	error!: string
}
