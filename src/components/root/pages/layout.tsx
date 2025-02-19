import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { useTheme } from '@/context/theme-context'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setTheme } = useTheme()
  // Load and apply theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark' | 'neon')
      const root = window.document.documentElement
      root.classList.remove('light', 'dark', 'neon')
      root.classList.add(savedTheme)
    }
  }, [])
  
  return (
    <div>
      {children}
      <Toaster />
    </div>
  )
}