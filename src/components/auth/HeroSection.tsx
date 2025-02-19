import { useEffect } from "react"
import { useTheme } from '@/context/theme-context'

interface HeroSectionProps {
  imageUrl?: string;
  altText?: string;
  onlyText?: boolean;
  className?: string;
}

const HeroSection = ({
  imageUrl = "/auth-side-cover.jpg",
  altText = "Cover photo",
  onlyText = false,
  className = "",
}: HeroSectionProps) => {
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
  
  const textContent = (
    <div className={`${onlyText ? "text-foreground" : "text-white"} ${className}`}>
      <h2 className="text-3xl font-bold mb-2 brand">Francium</h2>
      <p className="text-lg opacity-90">Connect with everyone</p>
    </div>
  );

  if (onlyText) {
    return <div className="relative md:hidden">{textContent}</div>;
  }

  return (
    <div className="relative hidden md:block w-full h-full bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 mix-blend-multiply" />
      <img
        src={imageUrl}
        alt={altText}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-8 left-8 right-8">{textContent}</div>
    </div>
  );
};

export default HeroSection;