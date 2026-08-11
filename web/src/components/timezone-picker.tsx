import { Globe } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'

const timezones = Intl.supportedValuesOf('timeZone')

function getTimezoneOffset(timeZone: string) {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		timeZoneName: 'longOffset',
	}).formatToParts(new Date())

	const offset = parts.find((part) => part.type === 'timeZoneName')?.value

	return offset?.replace('GMT', 'UTC') ?? 'UTC'
}

function formatTimezone(timeZone: string) {
	const offset = getTimezoneOffset(timeZone)

	return `(${offset}) ${timeZone.replaceAll('_', ' ')}`
}

interface TimezonePickerProps {
	value?: string
	onValueChange?: (timezone: string) => void
}

export function TimezonePicker({ value, onValueChange }: TimezonePickerProps) {
	const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<Button
					variant="secondary"
					role="combobox"
					aria-expanded={open}
					className="w-fit justify-between"
				>
					<Globe className="size-4" />
					{value || 'Select timezone'}
				</Button>
			</DialogTrigger>

			<DialogContent showCloseButton={false}>
				<Command>
					<CommandInput placeholder="Search timezone..." />

					<CommandList>
						<CommandEmpty>No timezone found.</CommandEmpty>

						<CommandGroup>
							{timezones.map((timezone) => (
								<CommandItem
									key={timezone}
									value={timezone}
									onSelect={() => {
										onValueChange?.(timezone)
										setOpen(false)
									}}
								>
									{formatTimezone(timezone)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	)
}
