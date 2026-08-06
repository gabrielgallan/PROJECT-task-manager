import { CircleCheck, CircleDashed, type LucideIcon, SquircleDashed } from 'lucide-react'
import type { TaskStatus } from '@/features/tasks/model/task-types'

export const TASK_STATUSES: TaskStatus[] = ['backlog', 'in_progress', 'done']

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
	backlog: 'Backlog',
	in_progress: 'In progress',
	done: 'Done',
}

export const TASK_STATUS_ICON: Record<TaskStatus, LucideIcon> = {
	backlog: SquircleDashed,
	in_progress: CircleDashed,
	done: CircleCheck,
}

export const TASK_STATUS_ICON_COLOR: Record<TaskStatus, string> = {
	backlog: 'text-slate-500',
	in_progress: 'text-amber-500',
	done: 'fill-emerald-500 stroke-emerald-500 [&>path]:stroke-background',
}
