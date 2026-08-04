import { ThemeProvider } from "@/components/theme-provider"

import "./index.css"
import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import { Toaster } from "./components/ui/sonner"

export function App() {
  return (
    <ThemeProvider>
      <Toaster />

      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
