import { LanguageSelect } from '@/components/language-select'
import { ThemeSelect } from '@/components/theme-select'
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
import { TimezonePicker } from './timezone-picker'

export function SystemSettings() {
	return (
		<Card className="bg-transparent ring-transparent">
			<CardHeader>
				<CardTitle className="text-lg">System</CardTitle>
			</CardHeader>

			<CardContent className="space-y-5">
				<div className="flex flex-col gap-4">
					<FieldSet>
						<FieldGroup>
							<FieldLegend variant="legend">Appearance</FieldLegend>
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
							<FieldLegend variant="legend">Timezone & Preferences</FieldLegend>
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
								<div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
									<div className="min-w-0">
										<FieldLabel>Timezone</FieldLabel>

										<FieldDescription>Set your preferred timezone.</FieldDescription>
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
