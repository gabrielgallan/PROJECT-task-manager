import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from './ui/dropdown-menu'

type SupportedLanguages = 'pt-BR' | 'en-US'

const LANGUAGE_LOCAL_STORAGE_KEY = 'task_manager.language'

const languages: Record<SupportedLanguages, { label: string }> = {
	'pt-BR': { label: 'Português BR' },
	'en-US': { label: 'English' },
} as const

type Language = keyof typeof languages

type LanguageSelectProps = {
	compact?: boolean
}

export function LanguageSelect({ compact = false }: LanguageSelectProps) {
	function handleChangeLanguage(language: Language) {
		localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, language)
	}

	const currentLanguage = 'en-US'

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Button
					variant="secondary"
					size={compact ? 'icon' : 'default'}
					className={cn(!compact && 'flex-1 justify-between')}
				>
					<div className="flex gap-2 items-center">
						<Languages className="size-4" />

						<span className={cn(compact && 'sr-only')}>
							{languages[currentLanguage].label ?? 'Idioma'}
						</span>
					</div>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent>
				{Object.entries(languages).map(([language, option]) => {
					return (
						<DropdownMenuItem
							key={language}
							onClick={() => handleChangeLanguage(language as Language)}
							className="justify-between"
						>
							<span>{option.label}</span>
						</DropdownMenuItem>
					)
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
