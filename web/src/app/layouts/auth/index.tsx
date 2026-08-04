import { Workflow } from 'lucide-react'
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
	return (
		<div className="grid grid-cols-2 min-h-screen antialiased">
			<div className="h-full bg-primary border-r p-10 text-primary-foreground flex flex-col justify-between">
				<div className="flex items-center gap-3 text-lg font-medium text-primary-foreground">
					<Workflow className="h-5 w-5" />

					<span className="font-semibold">task_manager</span>
				</div>
				<footer className="text-sm">task_manager &copy; {new Date().getFullYear()}</footer>
			</div>

			<div className="relative flex flex-col justify-center items-center">
				<Outlet />
			</div>
		</div>
	)
}
