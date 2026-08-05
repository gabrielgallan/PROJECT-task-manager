import { useTheme } from 'next-themes'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'

export function ThemeSettingItem() {
	const { theme, setTheme } = useTheme()

	return (
		<DropdownMenuItem closeOnClick={false} className="justify-between">
			Dark mode
			<Switch
				checked={theme === 'dark'}
				onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
			/>
		</DropdownMenuItem>
	)
}
