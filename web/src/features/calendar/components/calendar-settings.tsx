import { Settings2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { useCalendar } from '@/features/calendar/calendar-provider'

interface ICalendarSettingsProps {
	extraItems?: ReactNode
	showTimeFormat: boolean
	showWeekends: boolean
}

export function CalendarSettings({
	extraItems,
	showTimeFormat,
	showWeekends,
}: ICalendarSettingsProps) {
	const {
		use24HourFormat,
		toggleTimeFormat,
		showWeekends: weekendsEnabled,
		toggleWeekends,
	} = useCalendar()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" />}>
				<Settings2 />
				<span className="sr-only">Calendar settings</span>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Calendar</DropdownMenuLabel>
					{extraItems}

					{showTimeFormat && (
						<DropdownMenuItem closeOnClick={false} className="justify-between">
							24-hour clock
							<Switch
								checked={use24HourFormat}
								onCheckedChange={toggleTimeFormat}
								className="rounded-xs [&_span]:rounded-xs"
							/>
						</DropdownMenuItem>
					)}

					{showWeekends && (
						<DropdownMenuItem closeOnClick={false} className="justify-between">
							Show weekends
							<Switch
								checked={weekendsEnabled}
								onCheckedChange={toggleWeekends}
								className="rounded-xs [&_span]:rounded-xs"
							/>
						</DropdownMenuItem>
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
