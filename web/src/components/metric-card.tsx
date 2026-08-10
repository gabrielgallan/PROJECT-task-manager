import { TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface MetricCardProps {
	title: string
	count: number
	icon: React.ElementType
	iconClassName?: string
}

export function MetricCard({ title, count, icon: Icon, iconClassName }: MetricCardProps) {
	return (
		<Card className="px-0 gap-0 justify-between">
			<CardHeader className="flex items-start justify-between">
				<dt className="text-sm font-medium text-foreground">{title}</dt>

				<div className={`p-2 bg-muted rounded-md ${iconClassName ?? ''}`}>
					<Icon className="size-5" />
				</div>
			</CardHeader>

			<CardContent>
				<div className="flex gap-2 items-end">
					<dd className="text-3xl font-semibold">{count}</dd>

					<span className="flex gap-1 text-xs text-muted-foreground">
						<span className="flex items-center gap-1 font-medium text-rose-500 dark:text-rose-400">
							<TrendingDown className="size-3" /> -2%
						</span>
						than last week
					</span>
				</div>
			</CardContent>
		</Card>
	)
}
