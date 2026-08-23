import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { WorkLog, WorkLogProps } from '@/domain/task-manager/enterprise/entities/work-log'

export function makeWorkLog(override: Partial<WorkLogProps> = {}, id?: UniqueEntityID) {
	const workLog = WorkLog.create(
		{
			userId: new UniqueEntityID(),
			title: faker.lorem.sentence({ min: 3, max: 6 }),
			description: faker.lorem.paragraph(),
			startsAt: faker.date.anytime(),
			endsAt: faker.date.anytime(),
			...override,
		},
		id,
	)

	return workLog
}
