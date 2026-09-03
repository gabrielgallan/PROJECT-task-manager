import { EllipsisVertical, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useEndSession } from '@/features/identity/hooks/use-end-session'
import {
	getDisplayName,
	getUserInitials,
	type IdentityProfile,
} from '@/features/identity/model/identity'

export function NavUser({ user }: { user: IdentityProfile }) {
	const { handleSignOut, busy } = useEndSession()
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={<SidebarMenuButton className="py-6" aria-label="Account menu" />}
					>
						<Avatar>
							<AvatarImage src={user.avatarUrl || undefined} alt={getDisplayName(user)} />
							<AvatarFallback>{getUserInitials(user)}</AvatarFallback>
						</Avatar>
						<div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{getDisplayName(user)}</span>
							{user.jobTitle?.trim() && (
								<span className="truncate text-xs text-muted-foreground">{user.jobTitle}</span>
							)}
						</div>
						<EllipsisVertical className="ml-auto size-4" />
					</DropdownMenuTrigger>
					<DropdownMenuContent side="right" align="end">
						<DropdownMenuItem disabled={busy} onClick={() => void handleSignOut()}>
							<LogOut />
							{busy ? 'Signing out…' : 'Log out'}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
