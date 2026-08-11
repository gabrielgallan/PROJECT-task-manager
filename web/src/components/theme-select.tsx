import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { type Theme, useTheme } from './theme-provider'

const themeLabelMap: Record<Theme, string> = {
	dark: 'Dark',
	light: 'Light',
	system: 'System',
}

type ThemeSelectProps = {
	compact?: boolean
}

export function ThemeSelect({ compact = false }: ThemeSelectProps) {
	const { theme, setTheme } = useTheme()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button
					variant="secondary"
					size={compact ? 'icon' : 'default'}
					className={cn(!compact && 'justify-start')}
				>
					<span className="relative flex size-4 items-center justify-center">
						<Sun className="absolute size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
						<Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					</span>

					{!compact && <span>{themeLabelMap[theme]}</span>}

					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
