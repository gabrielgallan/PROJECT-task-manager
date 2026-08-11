import { CheckSquare2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface UpcomingDueDatesCardProps {
	dueTodayCount: number
	dueNext7DaysCount: number
}

export function UpcomingDueDatesCard({
	dueTodayCount,
	dueNext7DaysCount,
}: UpcomingDueDatesCardProps) {
	const total = dueTodayCount + dueNext7DaysCount

	return (
		<Card className="px-0 gap-0 justify-between">
			<CardHeader className="flex items-start justify-between">
				<dt className="text-sm font-medium text-foreground">Completed tasks</dt>

				<div className="p-2 bg-teal-500/20 text-teal-500 rounded-md">
					<CheckSquare2 className="size-5" />
				</div>
			</CardHeader>

			<CardContent>
				<div className="flex gap-2 items-end">
					<dd className="text-3xl font-semibold">{total}</dd>

					<span className="flex gap-1 text-xs text-muted-foreground">
						<span className="flex items-center gap-1 font-medium text-emerald-500 dark:text-emerald-400">
							<TrendingUp className="size-3" /> +2
						</span>
						than last week
					</span>
				</div>
			</CardContent>
		</Card>
	)
}
