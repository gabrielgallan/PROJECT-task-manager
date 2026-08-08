import { BrowserTitle } from '@/components/browser-title'
import { ContributionGraphExample } from '@/components/contribution-graph'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TestPage() {
	return (
		<>
			<BrowserTitle title="Test page" />

			<div className="styled-scrollbar flex min-h-0 flex-1 flex-col p-4">
				<Card className="w-fit border bg-transparent">
					<CardHeader>
						<CardTitle>Contribution Graph</CardTitle>
					</CardHeader>
					<CardContent>
						<ContributionGraphExample />
					</CardContent>
				</Card>
			</div>
		</>
	)
}
