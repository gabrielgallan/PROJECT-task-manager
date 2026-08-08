import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface MetricCardProps {
	title: string
	count: number
	description: string
	icon: React.ElementType
	iconClassName?: string
}

export function MetricCard({
	title,
	count,
	description,
	icon: Icon,
	iconClassName,
}: MetricCardProps) {
	return (
		<Card className="px-0 gap-0 justify-between">
			<CardHeader className="flex items-start justify-between">
				<dt className="text-sm font-medium text-foreground">{title}</dt>

				<div className={`p-2 bg-muted rounded-md ${iconClassName ?? ''}`}>
					<Icon className="size-5" />
				</div>
			</CardHeader>

			<CardContent>
				<div>
					<dd className="text-2xl font-semibold">{count}</dd>
					<p className="truncate text-xs text-muted-foreground">{description}</p>
				</div>
			</CardContent>
		</Card>
	)
}
