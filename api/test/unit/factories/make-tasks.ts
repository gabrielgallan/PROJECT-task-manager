import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Task, TaskProps } from '@/domain/task-manager/enterprise/entities/task'

export function makeTask(override: Partial<TaskProps> = {}, id?: UniqueEntityID) {
	const task = Task.create(
		{
			userId: new UniqueEntityID(),
			title: faker.lorem.sentence({ min: 3, max: 6 }),
			description: faker.lorem.paragraph(),
			status: faker.helpers.arrayElement(['BACKLOG', 'IN_PROGRESS', 'DONE'] as const),
			priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const),
			startDate: faker.date.recent({ days: 30 }),
			dueDate: faker.date.soon({ days: 15 }),
			...override,
		},
		id,
	)

	return task
}
