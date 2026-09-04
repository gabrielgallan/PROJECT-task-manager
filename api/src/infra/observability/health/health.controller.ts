import { Controller, Get, HttpCode } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { Public } from '@/infra/auth/public.decorator'

class HealthResponseDto {
	@ApiProperty({
		example: 'ok',
	})
	status!: string

	@ApiProperty({
		example: '2023-06-01T12:00:00.000Z',
	})
	timestamp!: string

	@ApiProperty({
		example: 123.456,
	})
	uptime!: number

	@ApiProperty({
		example: {
			rss: 12345678,
			heapTotal: 12345678,
			heapUsed: 12345678,
			external: 12345678,
			arrayBuffers: 12345678,
		},
	})
	memory!: NodeJS.MemoryUsage

	@ApiProperty({
		example: '1.0.0',
	})
	version!: string
}

@ApiTags('Health')
@Public()
@Controller()
export class HealthController {
	@ApiOperation({ summary: 'Check the health of the application' })
	@ApiOkResponse({ description: 'The application is healthy', type: HealthResponseDto })
	@Get('/api/health')
	@HttpCode(200)
	async handle(): Promise<HealthResponseDto> {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			version: process.env.npm_package_version || '1.0.0',
		}
	}
}
