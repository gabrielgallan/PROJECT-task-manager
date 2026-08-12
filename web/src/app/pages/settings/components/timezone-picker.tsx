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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

const TIMEZONE_STORAGE_KEY = 'task_manager.timezone'
const UTC_TIMEZONE = 'UTC'

function isValidTimezone(timezone: string) {
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format()
		return true
	} catch {
		return false
	}
}

function getLocalTimezone() {
	try {
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
		return timezone && isValidTimezone(timezone) ? timezone : UTC_TIMEZONE
	} catch {
		return UTC_TIMEZONE
	}
}

const localTimezone = getLocalTimezone()

const timezones = Array.from(
	new Set([
		UTC_TIMEZONE,
		localTimezone,
		...(typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []),
	]),
).filter(isValidTimezone)

function getInitialTimezone() {
	if (typeof window === 'undefined') return localTimezone

	try {
		const storedTimezone = window.localStorage.getItem(TIMEZONE_STORAGE_KEY)
		return storedTimezone && isValidTimezone(storedTimezone) ? storedTimezone : localTimezone
	} catch (error) {
		console.warn(`Error reading localStorage key "${TIMEZONE_STORAGE_KEY}":`, error)
		return localTimezone
	}
}

function getTimezoneOffset(timeZone: string) {
	try {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone,
			timeZoneName: 'longOffset',
		}).formatToParts(new Date())

		const offset = parts.find((part) => part.type === 'timeZoneName')?.value

		return offset?.replace('GMT', 'UTC') ?? UTC_TIMEZONE
	} catch {
		return UTC_TIMEZONE
	}
}

function formatTimezoneName(timezone: string) {
	return timezone.replaceAll('_', ' ')
}

function formatTimezoneOffset(offset: string) {
	return offset.replace('-', '−')
}

function normalizeSearchValue(value: string) {
	return value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[_/−-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function filterTimezone(value: string, search: string, keywords: string[] = []) {
	const searchableValue = normalizeSearchValue(`${value} ${keywords.join(' ')}`)
	return searchableValue.includes(normalizeSearchValue(search)) ? 1 : 0
}

function createTimezoneOption(timezone: string) {
	const name = formatTimezoneName(timezone)
	const rawOffset = getTimezoneOffset(timezone)

	return {
		timezone,
		name,
		offset: formatTimezoneOffset(rawOffset),
		keywords: [name, name.replaceAll('/', ' '), ...name.split(/[\s/]+/), rawOffset],
	}
}

const timezoneOptions = timezones.map(createTimezoneOption)

interface TimezonePickerProps {
	value?: string
	onValueChange?: (timezone: string) => void
}

export function TimezonePicker({ value, onValueChange }: TimezonePickerProps) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [storedTimezone, setStoredTimezone] = useState(getInitialTimezone)

	const selectedTimezone = value && isValidTimezone(value) ? value : storedTimezone
	const selectedName = formatTimezoneName(selectedTimezone)
	const selectedOffset = formatTimezoneOffset(getTimezoneOffset(selectedTimezone))

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen)

		if (!nextOpen) setSearch('')
	}

	const handleSelect = (timezone: string) => {
		if (!isValidTimezone(timezone)) return

		setStoredTimezone(timezone)

		try {
			window.localStorage.setItem(TIMEZONE_STORAGE_KEY, timezone)
		} catch (error) {
			console.warn(`Error setting localStorage key "${TIMEZONE_STORAGE_KEY}":`, error)
		}

		onValueChange?.(timezone)
		setSearch('')
		setOpen(false)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger
				render={
					<Button
						variant="secondary"
						role="combobox"
						aria-expanded={open}
						aria-label={`Timezone: ${selectedOffset}, ${selectedName}`}
						className="w-full min-w-0 justify-start sm:w-auto sm:max-w-72"
					/>
				}
			>
				<Globe className="size-4 shrink-0" />
				<span className="shrink-0 text-muted-foreground">{selectedOffset}</span>
				<span aria-hidden="true" className="text-muted-foreground">
					·
				</span>
				<span className="truncate">{selectedName}</span>
			</DialogTrigger>

			<DialogContent showCloseButton={false}>
				<Command filter={filterTimezone}>
					<CommandInput value={search} onValueChange={setSearch} placeholder="Search timezone..." />

					<CommandList>
						<CommandEmpty>No timezone found.</CommandEmpty>

						<CommandGroup>
							{timezoneOptions.map(({ timezone, name, offset, keywords }) => (
								<CommandItem
									key={timezone}
									value={timezone}
									keywords={keywords}
									data-checked={timezone === selectedTimezone}
									onSelect={() => handleSelect(timezone)}
								>
									<span className="shrink-0 text-muted-foreground">({offset})</span>
									<span className="truncate">{name}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	)
}
