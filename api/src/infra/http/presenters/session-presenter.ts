import { UAParser } from 'ua-parser-js'
import { Session } from '@/domain/identity/enterprise/entities/session'

export class SessionPresenter {
	static toHTTP(session: Session) {
		let userAgent: UAParser.IResult | null = null

		if (session.userAgent) {
			userAgent = new UAParser(session.userAgent).getResult()
		}

		return {
			id: session.id.toString(),
			ipAddress: session.ipAddress ?? null,
			userAgent: userAgent
				? {
						os: {
							name: userAgent.os.name,
							version: userAgent.os.version,
						},
						browser: {
							name: userAgent.browser.name,
							version: userAgent.browser.version,
						},
						device: {
							type: userAgent.device.type,
						},
					}
				: null,
			createdAt: session.createdAt,
			revokedAt: session.revokedAt ?? null,
		}
	}
}
