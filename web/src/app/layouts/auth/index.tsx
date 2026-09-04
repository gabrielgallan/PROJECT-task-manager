import { Workflow } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { ProductShowcase } from '@/app/layouts/auth/components/product-showcase'
import { DotPatternBackground } from '@/components/dot-pattern-background'

export function AuthLayout() {
	return (
		// One column until there is room for both: below `lg` the form alone is
		// wider than half the viewport, so the panel would squeeze it off-screen.
		<div className="grid min-h-screen grid-cols-1 antialiased lg:grid-cols-2">
			<div className="relative hidden h-full flex-col justify-between overflow-hidden border-r bg-primary p-10 text-primary-foreground lg:flex">
				<DotPatternBackground
					baseColor="var(--primary-foreground)"
					glowColor="var(--primary-foreground)"
					vignetteColor="color-mix(in srgb, var(--primary) 60%, transparent)"
					gap={20}
					dotSize={1}
				/>

				<div className="relative z-10 flex items-center gap-3 text-xl font-medium text-primary-foreground">
					<Workflow className="size-6" />

					<span className="font-semibold">task_manager</span>
				</div>

				<div className="relative z-10">
					<ProductShowcase />
				</div>

				<footer className="relative z-10 text-sm">
					&copy; {new Date().getFullYear()} task_manager.com. All rights reserved.
				</footer>
			</div>

			<div className="relative flex flex-col justify-center items-center">
				<Outlet />
			</div>
		</div>
	)
}
