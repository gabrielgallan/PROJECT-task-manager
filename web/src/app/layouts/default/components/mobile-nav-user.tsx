import { ChevronDown, Loader2, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import {
	getDisplayName,
	getUserInitials,
	type IdentityProfile,
} from '@/features/identity/model/identity'

export function MobileNavUser({ user }: { user: IdentityProfile }) {
	const { handleSignOut, busy } = useEndSession()
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className="flex items-center gap-2 rounded-lg p-1"
				aria-label="Account menu"
			>
				<ChevronDown className="size-4" />
				<Avatar>
					<AvatarImage src={user.avatarUrl || undefined} alt={getDisplayName(user)} />
					<AvatarFallback>{getUserInitials(user)}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-46">
				<div className="grid max-w-64 gap-1 px-2 py-2 text-sm">
					<span className="truncate font-medium">{getDisplayName(user)}</span>
					<span className="truncate text-xs text-muted-foreground">{user.email}</span>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled={busy} onClick={() => void handleSignOut()}>
					<LogOut />
					{busy ? <Loader2 className="animate-spin" /> : 'Log out'}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
