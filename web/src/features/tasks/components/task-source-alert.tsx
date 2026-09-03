import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getTaskError } from '../model/task-errors'

export function TaskSourceAlert({ error, loading, onRetry }: {
	error: unknown
	loading: boolean
	onRetry: () => void
}) {
	if (loading) return <p role="status" className="px-4 pt-3 text-sm text-muted-foreground">Loading tasks…</p>
	if (!error) return null
	return <div className="space-y-2 px-4 pt-3">
		<Alert variant="destructive"><AlertDescription>{getTaskError(error, 'list')}</AlertDescription></Alert>
		<Button type="button" size="sm" variant="outline" onClick={onRetry}>Try again</Button>
	</div>
}
