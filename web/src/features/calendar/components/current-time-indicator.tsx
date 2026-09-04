import { useEffect, useState } from 'react'
import { useCalendar } from '@/features/calendar/calendar-provider'
import { HOUR_HEIGHT } from '@/features/calendar/constants'
import { formatTime } from '@/features/calendar/lib/formatting'
import { cn } from '@/lib/utils'

const indicatorColor = 'bg-red-500'

interface IProps {
	showLabel?: boolean
}

export function CurrentTimeIndicator({ showLabel = false }: IProps) {
	const { use24HourFormat, getNow } = useCalendar()
	const [now, setNow] = useState(getNow)

	useEffect(() => {
		setNow(getNow())
		const timer = window.setInterval(() => setNow(getNow()), 60_000)
		return () => window.clearInterval(timer)
	}, [getNow])

	const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
	const top = (minutesSinceMidnight / 60) * HOUR_HEIGHT

	return (
		<div
			className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
			style={{ top: `${top}px` }}
		>
			<span className={cn(['absolute -left-1 size-2 rounded-full', indicatorColor])} />
			<span className={cn(['h-px w-full', indicatorColor])} />

			{showLabel && (
				<span
					className={cn(
						indicatorColor,
						'absolute right-full mr-2 -translate-y-px rounded px-1 py-px',
						'text-[10px] font-medium text-white tabular-nums',
					)}
				>
					{formatTime(now, use24HourFormat)}
				</span>
			)}
		</div>
	)
}
