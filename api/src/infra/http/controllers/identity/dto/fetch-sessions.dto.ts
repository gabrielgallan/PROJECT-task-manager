import { ApiProperty } from '@nestjs/swagger'

export class SessionDto {
	@ApiProperty()
	id: string

	@ApiProperty({
		nullable: true,
		example: '192.168.0.1',
	})
	ipAddress: string | null

	@ApiProperty({
		type: 'object',
		nullable: true,
		properties: {
			osName: {
				type: 'string',
				example: 'Windows',
			},
			osVersion: {
				type: 'string',
				example: '11',
			},
			browserName: {
				type: 'string',
				example: 'Chrome',
			},
			deviceType: {
				type: 'string',
				example: 'desktop',
			},
		},
	})
	userAgent: {
		osName?: string
		osVersion?: string
		browserName?: string
		deviceType?: string
	} | null

	@ApiProperty()
	createdAt: Date

	@ApiProperty({
		nullable: true,
	})
	revokedAt: Date | null
}

export class FetchSessionResponseDto {
	@ApiProperty({
		type: SessionDto,
		isArray: true,
	})
	sessions: SessionDto[]
}
