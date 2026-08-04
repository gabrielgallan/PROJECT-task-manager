import { Settings2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { useCalendar } from '@/features/calendar/contexts/calendar-context'

export function CalendarSettings() {
	const { use24HourFormat, toggleTimeFormat, showWeekends, toggleWeekends } = useCalendar()
	const { theme, setTheme } = useTheme()

	const isDark = theme === 'dark'

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" />}>
				<Settings2 />
				<span className="sr-only">Calendar settings</span>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Calendar</DropdownMenuLabel>

				<DropdownMenuItem closeOnClick={false} className="justify-between">
					Dark mode
					<Switch
						checked={isDark}
						onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
					/>
				</DropdownMenuItem>

				<DropdownMenuItem closeOnClick={false} className="justify-between">
					24-hour clock
					<Switch checked={use24HourFormat} onCheckedChange={toggleTimeFormat} />
				</DropdownMenuItem>

				<DropdownMenuItem closeOnClick={false} className="justify-between">
					Show weekends
					<Switch checked={showWeekends} onCheckedChange={toggleWeekends} />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
