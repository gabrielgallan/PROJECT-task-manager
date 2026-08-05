import { ThemeProvider } from '@/components/theme-provider'

import './index.css'
import './styles/scrollbar.css'

import { RouterProvider } from 'react-router-dom'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { router } from './router'

export function App() {
	return (
		<ThemeProvider>
			<TooltipProvider>
				<Toaster />

				<RouterProvider router={router} />
			</TooltipProvider>
		</ThemeProvider>
	)
}
