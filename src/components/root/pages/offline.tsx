import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useEffect } from "react"
import { useTheme } from '@/context/theme-context'

export default function Offline302() {
  const navigate = useNavigate()
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
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] font-bold leading-tight'>302</h1>
        <span className='font-medium'>You're offline!</span>
        <p className='text-center text-muted-foreground'>
          Reload the app once you are connected to the internet.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button onClick={() => navigate('/')}>Reload</Button>
        </div>
      </div>
    </div>
  )
}