export type IsoDateTime = string

export interface WorkLogTaskSummaryDto {
	id: string
	title: string
}

export interface WorkLogCategorySummaryDto {
	id: string
	name: string
	color: string
}

export interface WorkLogDto {
	id: string
	task: WorkLogTaskSummaryDto | null
	category: WorkLogCategorySummaryDto | null
	title: string
	description: string | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

export interface CreatedWorkLogDto {
	id: string
	taskId: string | null
	categoryId: string | null
	title: string
	description: string | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

export interface WorkLogReadOptions {
	signal?: AbortSignal
}

export interface WorkLogIdRequest {
	workLogId: string
}
