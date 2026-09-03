import { ThemeProvider } from '@/components/theme-provider'

import './index.css'
import './styles/data-visualization.css'
import './styles/scrollbar.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { queryClient } from './lib/react-query'
import { router } from './router'

export function App() {
	return (
		<ThemeProvider storageKey="task_manager.theme" defaultTheme="light">
			<TooltipProvider>
				<Toaster />

				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</TooltipProvider>
		</ThemeProvider>
	)
}
