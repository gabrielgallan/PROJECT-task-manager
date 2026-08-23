import z from 'zod'
import type {
	TaskOptionsCursor,
} from '@/domain/task-manager/application/repositories/tasks-repository'

const taskOptionsCursorSchema = z
	.object({
		title: z.string(),
		id: z.uuid(),
	})
	.strict()

export function encodeTaskOptionsCursor(cursor: TaskOptionsCursor) {
	return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}

export function decodeTaskOptionsCursor(cursor: string): TaskOptionsCursor | null {
	try {
		const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
		const result = taskOptionsCursorSchema.safeParse(value)

		return result.success ? result.data : null
	} catch {
		return null
	}
}
