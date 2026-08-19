import { ApiProperty } from '@nestjs/swagger'

export class RevokeAllSessionsReponseDto {
	@ApiProperty({
		example: 3,
	})
	sessionsCount!: number
}
