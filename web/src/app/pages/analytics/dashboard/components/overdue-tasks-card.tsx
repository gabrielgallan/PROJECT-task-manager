import { TrendingUp, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface OverdueTasksCardProps {
	overdueCount: number
}

export function OverdueTasksCard({ overdueCount }: OverdueTasksCardProps) {
	return (
		<Card className="px-0 gap-0 justify-between">
			<CardHeader className="flex items-start justify-between">
				<dt className="text-sm font-medium text-foreground">Overdue tasks</dt>

				<div className={'p-2 bg-rose-500/20 text-rose-500 rounded-md'}>
					<TriangleAlert className="size-5" />
				</div>
			</CardHeader>

			<CardContent>
				<div className="flex gap-2 items-end">
					<dd className="text-3xl font-semibold">{overdueCount}</dd>

					<span className="flex gap-1 text-xs text-muted-foreground">
						<span className="flex items-center gap-1 font-medium text-rose-500 dark:text-rose-400">
							<TrendingUp className="size-3" /> +3
						</span>
						than last week
					</span>
				</div>
			</CardContent>
		</Card>
	)
}
