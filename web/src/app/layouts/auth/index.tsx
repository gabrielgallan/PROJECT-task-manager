import { Workflow } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { ProductShowcase } from '@/app/layouts/auth/components/product-showcase'
import { cn } from '@/lib/utils'

export function AuthLayout() {
	return (
		// One column until there is room for both: below `lg` the form alone is
		// wider than half the viewport, so the panel would squeeze it off-screen.
		<div className="grid min-h-screen grid-cols-1 antialiased lg:grid-cols-2">
			<div
				className={cn([
					'hidden h-full flex-col justify-between border-r bg-primary p-10 text-primary-foreground lg:flex',
				])}
				style={{
					backgroundImage:
						'radial-gradient(circle, color-mix(in srgb, var(--background) 3%, transparent) 1px, transparent 1px)',
					backgroundSize: '20px 20px',
				}}
			>
				<div className="flex items-center gap-3 text-xl font-medium text-primary-foreground">
					<Workflow className="size-6" />

					<span className="font-semibold">task_manager</span>
				</div>

				<ProductShowcase />

				<footer className="text-sm">
					&copy; {new Date().getFullYear()} task_manager.com. All rights reserved.
				</footer>
			</div>

			<div className="relative flex flex-col justify-center items-center">
				<Outlet />
			</div>
		</div>
	)
}
