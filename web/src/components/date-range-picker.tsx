'use client'

import { useMediaQuery } from '@uidotdev/usehooks'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import * as React from 'react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface IDateRangePreset {
	label: string
	value: DateRange
}

interface IDateRangePickerProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
	value: DateRange | undefined
	onValueChange: (value: DateRange | undefined) => void
	label?: string
	presets?: IDateRangePreset[]
}

function formatDateRange(value: DateRange | undefined) {
	if (!value?.from) return 'Select period'
	if (!value.to) return `${format(value.from, 'MMM d, yyyy')} – Select end date`
	return `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`
}

export function DateRangePicker({
	value,
	onValueChange,
	label = 'Date range',
	presets = [],
	className,
	...props
}: IDateRangePickerProps) {
	const isDesktop = useMediaQuery('(min-width: 768px)')
	const [open, setOpen] = React.useState(false)

	return (
		<Field className={cn('w-full sm:w-auto', className)} {...props}>
			<FieldLabel htmlFor="date-picker-range" className="sr-only">
				{label}
			</FieldLabel>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button
							variant="outline"
							size="sm"
							id="date-picker-range"
							aria-label={`${label}: ${formatDateRange(value)}`}
							className="w-full justify-start px-2.5 font-normal sm:w-auto"
						>
							<CalendarIcon data-icon="inline-start" />
							<span className="truncate">{formatDateRange(value)}</span>
						</Button>
					}
				/>
				<PopoverContent
					className="flex max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-auto p-0 md:w-auto md:flex-row"
					align="start"
				>
					{presets.length > 0 && (
						<div className="grid shrink-0 grid-cols-2 gap-1 border-b p-2 md:w-36 md:grid-cols-1 md:border-r md:border-b-0">
							{presets.map((preset) => (
								<Button
									key={preset.label}
									type="button"
									variant="ghost"
									size="sm"
									className="justify-start font-normal"
									onClick={() => {
										onValueChange(preset.value)
										setOpen(false)
									}}
								>
									{preset.label}
								</Button>
							))}
						</div>
					)}
					<Calendar
						mode="range"
						defaultMonth={value?.from}
						selected={value}
						onSelect={onValueChange}
						numberOfMonths={isDesktop ? 2 : 1}
					/>
				</PopoverContent>
			</Popover>
		</Field>
	)
}
