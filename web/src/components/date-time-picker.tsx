import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface IDateTimePickerProps {
	id: string
	label: string
	value?: Date
	use24HourFormat: boolean
	onChange: (date: Date) => void
	onBlur?: () => void
	invalid?: boolean
	error?: string
}

export function DateTimePicker({
	id,
	label,
	value,
	use24HourFormat,
	onChange,
	onBlur,
	invalid,
	error,
}: IDateTimePickerProps) {
	const hours = use24HourFormat
		? Array.from({ length: 24 }, (_, index) => index)
		: [12, ...Array.from({ length: 11 }, (_, index) => index + 1)]
	const minutes = Array.from({ length: 12 }, (_, index) => index * 5)

	function handleDateSelect(date: Date | undefined) {
		if (!date) return
		const next = new Date(date)
		if (value) next.setHours(value.getHours(), value.getMinutes(), 0, 0)
		else next.setSeconds(0, 0)
		onChange(next)
	}

	function handleHourSelect(hour: number) {
		const next = new Date(value ?? new Date())
		if (use24HourFormat) next.setHours(hour)
		else next.setHours((hour % 12) + (next.getHours() >= 12 ? 12 : 0))
		onChange(next)
	}

	function handleMinuteSelect(minute: number) {
		const next = new Date(value ?? new Date())
		next.setMinutes(minute)
		onChange(next)
	}

	function handleMeridiemSelect(meridiem: 'AM' | 'PM') {
		const next = new Date(value ?? new Date())
		const currentHours = next.getHours()
		if (meridiem === 'AM' && currentHours >= 12) next.setHours(currentHours - 12)
		else if (meridiem === 'PM' && currentHours < 12) next.setHours(currentHours + 12)
		onChange(next)
	}

	function isHourSelected(hour: number) {
		if (!value) return false
		return use24HourFormat ? value.getHours() === hour : value.getHours() % 12 === hour % 12
	}

	return (
		<Field data-invalid={invalid}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>

			<Popover>
				<PopoverTrigger
					render={
						<Button
							id={id}
							type="button"
							variant="outline"
							aria-invalid={invalid}
							onBlur={onBlur}
							className={cn(
								'w-full justify-start pl-3 text-left font-normal',
								!value && 'text-muted-foreground',
							)}
						/>
					}
				>
					{value
						? format(value, use24HourFormat ? 'MM/dd/yyyy HH:mm' : 'MM/dd/yyyy hh:mm aa')
						: use24HourFormat
							? 'MM/DD/YYYY HH:mm'
							: 'MM/DD/YYYY hh:mm aa'}
					<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
				</PopoverTrigger>

				<PopoverContent className="w-auto p-0">
					<div className="sm:flex">
						<Calendar mode="single" selected={value} onSelect={handleDateSelect} autoFocus />

						<div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
							<ScrollArea className="w-64 sm:w-auto">
								<div className="flex p-2 sm:flex-col">
									{hours.map((hour) => (
										<Button
											key={hour}
											type="button"
											size="icon"
											variant={isHourSelected(hour) ? 'default' : 'ghost'}
											className="aspect-square shrink-0 sm:w-full"
											onClick={() => handleHourSelect(hour)}
										>
											{hour.toString().padStart(2, '0')}
										</Button>
									))}
								</div>
								<ScrollBar orientation="horizontal" className="sm:hidden" />
							</ScrollArea>

							<ScrollArea className="w-64 sm:w-auto">
								<div className="flex p-2 sm:flex-col">
									{minutes.map((minute) => (
										<Button
											key={minute}
											type="button"
											size="icon"
											variant={value && value.getMinutes() === minute ? 'default' : 'ghost'}
											className="aspect-square shrink-0 sm:w-full"
											onClick={() => handleMinuteSelect(minute)}
										>
											{minute.toString().padStart(2, '0')}
										</Button>
									))}
								</div>
								<ScrollBar orientation="horizontal" className="sm:hidden" />
							</ScrollArea>

							{!use24HourFormat && (
								<ScrollArea className="w-64 sm:w-auto">
									<div className="flex p-2 sm:flex-col">
										{(['AM', 'PM'] as const).map((meridiem) => (
											<Button
												key={meridiem}
												type="button"
												size="icon"
												variant={
													value &&
													((meridiem === 'AM' && value.getHours() < 12) ||
														(meridiem === 'PM' && value.getHours() >= 12))
														? 'default'
														: 'ghost'
												}
												className="aspect-square shrink-0 sm:w-full"
												onClick={() => handleMeridiemSelect(meridiem)}
											>
												{meridiem}
											</Button>
										))}
									</div>
									<ScrollBar orientation="horizontal" className="sm:hidden" />
								</ScrollArea>
							)}
						</div>
					</div>
				</PopoverContent>
			</Popover>

			{error && <FieldError>{error}</FieldError>}
		</Field>
	)
}
