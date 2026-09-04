export type IsoDateTime = string

export interface PlanTaskSummaryDto {
	id: string
	title: string
}
export interface PlanCategorySummaryDto {
	id: string
	name: string
	color: string
}

export interface PlanDto {
	id: string
	task: PlanTaskSummaryDto | null
	category: PlanCategorySummaryDto | null
	title: string
	description: string | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	confirmedAt: IsoDateTime | null
}

export interface CreatedPlanDto {
	id: string
	taskId: string | null
	categoryId: string | null
	title: string
	description: string | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	confirmedAt: IsoDateTime | null
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

export interface PlanReadOptions {
	signal?: AbortSignal
}
export interface PlanIdRequest {
	planId: string
}
