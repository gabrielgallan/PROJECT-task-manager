import { useRef } from 'react'
import { TimePickerInput } from '@/components/time-picker-input'

interface ITimeOfDayInputProps {
	id: string
	label: string
	value: Date
	disabled?: boolean
	onChange: (value: Date) => void
}

export function TimeOfDayInput({ id, label, value, disabled, onChange }: ITimeOfDayInputProps) {
	const minutesRef = useRef<HTMLInputElement>(null)

	const handleChange = (next: Date | undefined) => {
		if (next) onChange(next)
	}

	return (
		<div className="flex items-center gap-1">
			<TimePickerInput
				picker="hours"
				id={`${id}-hours`}
				aria-label={`${label} hours`}
				date={value}
				setDate={handleChange}
				disabled={disabled}
				onRightFocus={() => minutesRef.current?.focus()}
			/>

			<span className="text-muted-foreground">:</span>

			<TimePickerInput
				ref={minutesRef}
				picker="minutes"
				id={`${id}-minutes`}
				aria-label={`${label} minutes`}
				date={value}
				setDate={handleChange}
				disabled={disabled}
			/>
		</div>
	)
}
