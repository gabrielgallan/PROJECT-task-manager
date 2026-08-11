import { TimePickerInput } from '@/components/time-picker-input'

export function WorkingHoursInput() {
	return (
		<div className="flex gap-2 items-center">
			<div className='flex flex-col gap-1'>
				<TimePickerInput date={new Date()} setDate={() => {}} picker='hours' />
			</div>

			<span>to</span>

			<div className='flex flex-col gap-1'>
				<TimePickerInput date={new Date()} setDate={() => {}} picker='hours' />
			</div>
		</div>
	)
}
