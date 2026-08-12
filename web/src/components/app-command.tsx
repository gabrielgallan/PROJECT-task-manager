import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APP_NAVIGATION_ITEMS, APP_QUICK_ACTIONS } from '@/app/navigation'
import { SETTINGS_TABS, type TSettingsTab } from '@/app/pages/settings/config'
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { COMMAND_ACTION_PARAM, COMMAND_CREATE_ACTION } from '@/hooks/use-create-action'

interface IAppCommandContext {
	openCommand: () => void
}

const AppCommandContext = createContext<IAppCommandContext | null>(null)

export function useAppCommand() {
	const context = useContext(AppCommandContext)

	if (!context) {
		throw new Error('useAppCommand must be used within AppCommand')
	}

	return context
}

function getSettingsPath(tab: TSettingsTab) {
	return tab === 'profile' ? '/settings' : `/settings?tab=${tab}`
}

interface IAppCommandProps {
	children: ReactNode
}

export function AppCommand({ children }: IAppCommandProps) {
	const navigate = useNavigate()
	const location = useLocation()
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const previousFocusRef = useRef<HTMLElement | null>(null)

	const restoreFocus = useCallback(() => {
		const previousFocus = previousFocusRef.current

		requestAnimationFrame(() => {
			if (previousFocus?.isConnected) previousFocus.focus()
		})
	}, [])

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			setOpen(nextOpen)

			if (!nextOpen) {
				setSearch('')
				restoreFocus()
			}
		},
		[restoreFocus],
	)

	const openCommand = useCallback(() => {
		previousFocusRef.current =
			document.activeElement instanceof HTMLElement ? document.activeElement : null
		setOpen(true)
	}, [])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key.toLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey)) return

			event.preventDefault()

			if (open) {
				handleOpenChange(false)
			} else {
				openCommand()
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [handleOpenChange, open, openCommand])

	const contextValue = useMemo(() => ({ openCommand }), [openCommand])

	const runCommand = (callback: () => void) => {
		handleOpenChange(false)
		callback()
	}

	const navigateToCreate = (path: string) => {
		runCommand(() => {
			if (location.pathname === path) {
				const next = new URLSearchParams(location.search)
				next.set(COMMAND_ACTION_PARAM, COMMAND_CREATE_ACTION)

				navigate({ pathname: path, search: `?${next.toString()}` })
				return
			}

			navigate(`${path}?${COMMAND_ACTION_PARAM}=${COMMAND_CREATE_ACTION}`)
		})
	}

	return (
		<AppCommandContext.Provider value={contextValue}>
			{children}

			<CommandDialog
				open={open}
				onOpenChange={handleOpenChange}
				title="Command menu"
				description="Search pages, settings, and quick actions."
				className="w-[calc(100%-2rem)] sm:max-w-sm"
			>
				<Command loop>
					<CommandInput
						autoFocus
						value={search}
						onValueChange={setSearch}
						placeholder="Search pages and actions..."
					/>

					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>

						<CommandGroup heading="Quick actions">
							{APP_QUICK_ACTIONS.map((action) => (
								<CommandItem
									key={action.path}
									value={action.label}
									keywords={[...action.keywords]}
									className="[&>svg:last-child]:hidden"
									onSelect={() => navigateToCreate(action.path)}
								>
									<action.icon />
									<span>{action.label}</span>
								</CommandItem>
							))}
						</CommandGroup>

						<CommandGroup heading="Navigation">
							{APP_NAVIGATION_ITEMS.map((item) => (
								<CommandItem
									key={item.path}
									value={item.label}
									keywords={[...item.keywords]}
									className="[&>svg:last-child]:hidden"
									onSelect={() => runCommand(() => navigate(item.path))}
								>
									<item.icon />
									<span>{item.label}</span>
								</CommandItem>
							))}
						</CommandGroup>

						<CommandGroup heading="Settings">
							{SETTINGS_TABS.map((tab) => (
								<CommandItem
									key={tab.value}
									value={tab.label}
									keywords={[...tab.keywords]}
									className="[&>svg:last-child]:hidden"
									onSelect={() => runCommand(() => navigate(getSettingsPath(tab.value)))}
								>
									<tab.icon />
									<span>{tab.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</CommandDialog>
		</AppCommandContext.Provider>
	)
}
