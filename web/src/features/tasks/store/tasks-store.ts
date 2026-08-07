import { atom, useAtom } from 'jotai'
import { useCallback } from 'react'
import { TASKS_MOCK } from '@/features/tasks/mocks/tasks'
import type { Task, TaskStatus } from '@/features/tasks/model/task-types'

/**
 * Prototype-scoped state, not a data layer. It exists so the list and the
 * timeline mutate the same collection: a status changed in one view has to be
 * visible when switching to the other.
 */
const tasksAtom = atom<Task[]>(TASKS_MOCK)

export function useTasks() {
	const [tasks, setTasks] = useAtom(tasksAtom)

	const patchTask = useCallback(
		(id: string, patch: Partial<Task>) =>
			setTasks((previous) =>
				previous.map((task) =>
					task.id === id ? { ...task, ...patch, updatedAt: new Date() } : task,
				),
			),
		[setTasks],
	)

	const changeTaskStatus = useCallback(
		(id: string, status: TaskStatus) => patchTask(id, { status }),
		[patchTask],
	)

	const rescheduleTask = useCallback(
		(id: string, startDate: Date, dueDate: Date) => patchTask(id, { startDate, dueDate }),
		[patchTask],
	)

	const removeTask = useCallback(
		(id: string) => setTasks((previous) => previous.filter((task) => task.id !== id)),
		[setTasks],
	)

	return { tasks, patchTask, changeTaskStatus, rescheduleTask, removeTask }
}
