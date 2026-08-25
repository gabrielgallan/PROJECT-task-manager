import { ValueObject } from '@/core/entities/value-object'

export interface PlanDataProps {
	id: string
	taskId: string | null
	categoryId: string | null
	task: {
		id: string
		title: string
	} | null
	category: {
		id: string
		name: string
		color: string
	} | null
	title: string
	description: string | null
	startsAt: Date
	endsAt: Date
	confirmedAt: Date | null
}

export class PlanData extends ValueObject<PlanDataProps> {
	static create(props: PlanDataProps) {
		const planData = new PlanData({
			...props,
		})

		return planData
	}

	get id() {
		return this.props.id
	}

	get taskId() {
		return this.props.taskId
	}

	get categoryId() {
		return this.props.categoryId
	}

	get task() {
		return this.props.task
	}

	get category() {
		return this.props.category
	}

	get title() {
		return this.props.title
	}

	get description() {
		return this.props.description
	}

	get startsAt() {
		return this.props.startsAt
	}

	get endsAt() {
		return this.props.endsAt
	}

	get confirmedAt() {
		return this.props.confirmedAt
	}
}
