import { ApiProperty } from '@nestjs/swagger'

export class ApiErrorResponseDto {
	@ApiProperty()
	statusCode: number

	@ApiProperty()
	message: string

	@ApiProperty()
	error: string
}
