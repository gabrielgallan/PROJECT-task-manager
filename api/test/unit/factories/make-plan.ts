import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Plan, PlanProps } from '@/domain/task-manager/enterprise/entities/plan'

export function makePlan(override: Partial<PlanProps> = {}, id?: UniqueEntityID) {
	const plan = Plan.create(
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

	return plan
}
