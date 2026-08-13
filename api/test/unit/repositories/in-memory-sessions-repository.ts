import { Injectable } from '@nestjs/common'
import { SessionsRepository } from '@/domain/identity/application/repositories/sessions-repository'
import { Session } from '@/domain/identity/enterprise/entities/session'

@Injectable()
export class InMemorySessionsRepository implements SessionsRepository {
	public items: Session[] = []

	async create(session: Session) {
		this.items.push(session)

		return
	}
}
