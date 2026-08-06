import { CircleAlert, Clock } from 'lucide-react'
import { formatMinutes } from '@/features/work-logs/model/work-log-rules'

interface IWorkLogSummaryProps {
	loggedMinutes: number
	untrackedMinutes: number
}

export function WorkLogSummary({ loggedMinutes, untrackedMinutes }: IWorkLogSummaryProps) {
	return (
		<div className="flex items-center gap-3 text-xs">
			<span className="flex items-center gap-1.5 font-medium">
				<Clock className="size-3.5 text-muted-foreground" />
				{formatMinutes(loggedMinutes)} logged
			</span>

			{untrackedMinutes > 0 && (
				<span
					className="flex items-center gap-1.5 text-muted-foreground"
					title="Time between the first and the last log with nothing recorded"
				>
					<CircleAlert className="size-3.5" />
					{formatMinutes(untrackedMinutes)} untracked
				</span>
			)}
		</div>
	)
}
