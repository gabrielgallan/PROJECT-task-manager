import { Controller, Get } from '@nestjs/common'
import { Public } from '@/infra/auth/public.decorator'

@Controller()
@Public()
export class HealthController {
	@Get('/api/health')
	handle(): { ok: boolean; date: Date } {
		return { ok: true, date: new Date() }
	}
}
