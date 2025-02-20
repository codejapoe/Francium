import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FaApple } from "react-icons/fa";
import { FaAndroid } from "react-icons/fa";
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/context/theme-context'

export default function Download() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
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
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        }
    };

    return (
        <div className='min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground px-4 py-8'>
            <div className='w-full max-w-[320px] text-center space-y-4'>
                <div className='space-y-1'>
                    <p className="text-2xl font-bold">Download Francium</p>
                    <p className="text-sm text-muted-foreground">Choose your platform</p>
                </div>
                <div></div>
                <Button className="w-full" onClick={() => window.location.href = "https://francium.rf.gd/download.php"}>
                    <FaApple className='h-4 w-4 mr-2'/>
                    iOS
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or
                        </span>
                    </div>
                </div>
                <Button className="w-full" onClick={handleInstall}>
                    <FaAndroid className='h-4 w-4 mr-2'/>
                    Android
                </Button>
            </div>
        </div>
    )
}