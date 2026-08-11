import { LanguageSelect } from '@/components/language-select'
import { ThemeSelect } from '@/components/theme-select'
import { TimezonePicker } from '@/components/timezone-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
} from '@/components/ui/field'
import { WorkingHoursInput } from './working-hours-input'
import { Brush, Settings } from 'lucide-react'

export function SystemSettings() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">System</CardTitle>
			</CardHeader>

			<CardContent className="space-y-5">
				<div className="flex flex-col gap-4">
					<FieldSet>
						<FieldGroup>
							<Field>
								<div className="flex items-center justify-between">
									<div>
										<FieldLabel>Theme</FieldLabel>

										<FieldDescription>Toggle application theme</FieldDescription>
									</div>

									<ThemeSelect />
								</div>
							</Field>
						</FieldGroup>

						<FieldSeparator />

						<FieldGroup>
							<Field>
								<div className="flex items-center justify-between">
									<div>
										<FieldLabel>Language</FieldLabel>

										<FieldDescription>Toggle application language</FieldDescription>
									</div>

									<LanguageSelect />
								</div>
							</Field>

							<FieldSeparator />

							<Field>
								<div className="flex items-center justify-between">
									<div>
										<FieldLabel>Timezone</FieldLabel>

										<FieldDescription>Let us know your timezone</FieldDescription>
									</div>

									<TimezonePicker />
								</div>
							</Field>
						</FieldGroup>
					</FieldSet>
				</div>
			</CardContent>
		</Card>
	)
}
