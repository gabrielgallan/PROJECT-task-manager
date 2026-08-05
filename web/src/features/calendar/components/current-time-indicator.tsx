import { useEffect, useState } from 'react'
import { useCalendar } from '@/features/calendar/calendar-provider'
import { HOUR_HEIGHT } from '@/features/calendar/constants'
import { formatTime } from '@/features/calendar/lib/formatting'
import { cn } from '@/lib/utils'

interface IProps {
	showLabel?: boolean
}

export function CurrentTimeIndicator({ showLabel = false }: IProps) {
	const { use24HourFormat } = useCalendar()
	const [now, setNow] = useState(() => new Date())

	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), 60_000)
		return () => window.clearInterval(timer)
	}, [])

	const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
	const top = (minutesSinceMidnight / 60) * HOUR_HEIGHT

	return (
		<div
			className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
			style={{ top: `${top}px` }}
		>
			<span className="absolute -left-1 size-2 rounded-full bg-red-500" />
			<span className="h-px w-full bg-red-500" />

			{showLabel && (
				<span
					className={cn(
						'absolute right-full mr-2 -translate-y-px rounded bg-red-500 px-1 py-px',
						'text-[10px] font-medium text-white tabular-nums',
					)}
				>
					{formatTime(now, use24HourFormat)}
				</span>
			)}
		</div>
	)
}
