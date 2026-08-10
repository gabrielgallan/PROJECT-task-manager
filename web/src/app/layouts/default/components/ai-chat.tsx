import { GitBranchIcon, Loader2 } from 'lucide-react'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'

export function AiChat() {
	return (
		<aside className="flex h-full flex-col">
			<div className="w-full flex flex-col overflow-y-auto p-6 gap-8">
				<Marker>
					<MarkerIcon>
						<GitBranchIcon />
					</MarkerIcon>
					<MarkerContent>Context updated from Dashboard</MarkerContent>
				</Marker>

				<Bubble align="end">
					<BubbleContent className="max-w-[85%] bg-primary text-primary-foreground">
						Help me plan the rest of my week.
					</BubbleContent>
				</Bubble>

				<Bubble variant="ghost">
					<BubbleContent className="max-w-[90%]">
						You have <strong>3 overdue tasks</strong> and <strong>11h30</strong> of remaining
						capacity this week. I suggest prioritizing the dashboard layout before Friday.
					</BubbleContent>
				</Bubble>

				<Marker>
					<MarkerIcon>
						<Loader2 className="animate-spin" />
					</MarkerIcon>
					<MarkerContent className="shimmer">Thinking</MarkerContent>
				</Marker>
			</div>
		</aside>
	)
}
