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
						osName: userAgent.os.name,
						osVersion: userAgent.os.version,
						browserName: userAgent.browser.name,
						deviceType: userAgent.device.type,
					}
				: null,
			createdAt: session.createdAt,
			revokedAt: session.revokedAt ?? null,
		}
	}
}
