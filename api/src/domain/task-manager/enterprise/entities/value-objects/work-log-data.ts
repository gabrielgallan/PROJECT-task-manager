import { ValueObject } from '@/core/entities/value-object'

export interface WorkLogDataProps {
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
	createdAt: Date
	updatedAt: Date | null
}

export class WorkLogData extends ValueObject<WorkLogDataProps> {
	static create(props: WorkLogDataProps) {
		return new WorkLogData({ ...props })
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

	get createdAt() {
		return this.props.createdAt
	}

	get updatedAt() {
		return this.props.updatedAt
	}
}
