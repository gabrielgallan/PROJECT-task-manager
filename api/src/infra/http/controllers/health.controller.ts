import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
	@Get('/api/health')
	handle(): { ok: boolean; date: Date } {
		return { ok: true, date: new Date() }
	}
}
