import { Link } from 'react-router-dom';
import Cookies from "js-cookie";
import { Search, CircleUser, Settings, UserCheck, Star, Bookmark, BadgeCheck, Trash2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useScrollDirection } from '@/lib/hooks/useScrollDirection';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HeaderInfo {
  activeTab: string,
  username: string,
  name: string,
  profile: string,
  verified: boolean,
}

export default function Header({ activeTab="followings", username, name, profile, verified=false }: HeaderInfo) {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const scrollDirection = useScrollDirection();
  const [searchHistory, setSearchHistory] = useState(() => {
    return JSON.parse(localStorage.getItem('recentSearches') || '[]');
  });
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Store in localStorage
      const storedSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updatedSearches = [searchQuery.trim(), ...storedSearches.filter(s => s !== searchQuery.trim())].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

      setIsSearchOpen(false);
      navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
      setSearchHistory(updatedSearches);
      setSearchQuery("");
    }
  };

  const signout = () => {
    Cookies.remove('user_id');
    Cookies.remove('email');
    Cookies.remove('password');
    Cookies.remove('access_token');
    navigate('/sign-in');
    return;
  }

  return (
    <header
      className={`sticky transition-all duration-300 ${
        scrollDirection === 'down' &&
        window.matchMedia('(max-width: 767px)').matches
          ? '-top-20'
          : 'top-0'
      } z-10 navbar border-b border-border`}
    >
      <div className="container mx-auto px-4 py-3 flex flex-col lg:flex-row items-center justify-between">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <div className='hidden lg:block'>
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Francium Logo" width={24} height={24} />
              <span className="text-xl font-bold brand">Francium</span>
            </Link>
          </div>
          { activeTab === "#" ? (
            <div className='block lg:hidden'>
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Francium Logo" width={24} height={24} />
              <span className="text-xl font-bold brand">Francium</span>
            </Link>
          </div>
          ) : (
            <div className='flex items-center lg:hidden'>
              <img src="/logo.png" alt="Francium Logo" width={24} height={24} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="link" className="ring-0 border-0 focus-visible:ring-offset-0 focus-visible:ring-0 text-foreground">
                    <span className="text-xl font-bold brand text-foreground">Francium</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align='start'>
                  <DropdownMenuRadioGroup value={activeTab}>
                    <DropdownMenuRadioItem value="followings" onClick={() => navigate('/')}>
                      <UserCheck className="h-4 w-4" />
                      &nbsp;&nbsp;Followings
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="favorites" onClick={() => navigate('/favorites')}>
                      <Star className="h-4 w-4" />
                      &nbsp;&nbsp;Favorites
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          { Cookies.get('email') == undefined ? (
            <div className="flex items-center lg:hidden gap-2">
              <Link to='/sign-in'>
                <Button variant="outline">
                  Sign in
                </Button>
              </Link>
              <Link to='/sign-up'>
                <Button>Sign up</Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-4 lg:hidden">
              {/* Mobile Search Dialog */}
              <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Search</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSearch} className="relative mt-4">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      className="pl-8 w-full text-md" 
                      placeholder="Search" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                  <div className="mt-4">
                    <div className='flex justify-between items-center mb-2'>
                      <h4 className="mb-2 text-sm font-medium">Recent Searches</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchHistory([])}
                        title="Clear all searches"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  <ScrollArea className="h-[200px]">
                    <ul className="space-y-2">
                      {searchHistory.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <Button variant="ghost" className="w-full justify-start text-sm">
                            <Search className="mr-2 h-4 w-4" />
                            {item}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
                </DialogContent>
              </Dialog>
              {/* Mobile Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile} alt="User" className='object-cover object-center'/>
                      <AvatarFallback>Fr</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className='flex items-center'>
                        <p className="text-sm font-medium">{name}</p>
                        {verified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
                      </div>
                      <p className="text-xs text-muted-foreground">@{username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/${username}`)}>
                    <CircleUser className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/bookmarks`)}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>Bookmarks</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/settings`)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className='text-red-500 focus:text-red-600' onClick={signout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Tabs (Desktop View) */}
        { activeTab !== "#" && Cookies.get('email') != undefined && (
          <Tabs defaultValue={activeTab} className="hidden lg:block w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="followings" onClick={() => navigate('/')}>
                <UserCheck className="h-4 w-4" />
                &nbsp;&nbsp;Followings
              </TabsTrigger>
              <TabsTrigger value="favorites" onClick={() => navigate('/favorites')}>
                <Star className="h-4 w-4" />
                &nbsp;&nbsp;Favorites
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Desktop Search and Profile */}
        { Cookies.get('email') == undefined ? (
          <div className="hidden lg:flex items-center gap-4">
            <Link to='/sign-in'>
              <Button variant="outline">
                Sign in
              </Button>
            </Link>
            <Link to='/sign-up'>
              <Button>Sign up</Button>
            </Link>
          </div>
        ) : (
          <div className="hidden lg:flex items-center space-x-4">
            {/* Desktop Search */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Search</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSearch} className="relative mt-4">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    className="pl-8 w-full text-md" 
                    placeholder="Search" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                <div className="mt-4">
                  <div className='flex justify-between items-center mb-2'>
                    <h4 className="mb-2 text-sm font-medium">Recent Searches</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSearchHistory([])}
                      title="Clear all searches"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <ul className="space-y-2">
                      {searchHistory.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <Button variant="ghost" className="w-full justify-start text-sm">
                            <Search className="mr-2 h-4 w-4" />
                            {item}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
            {/* Desktop Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile} alt="User" className='object-cover object-center' />
                    <AvatarFallback>Fr</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center">
                      <p className="font-medium">{name}</p>
                      {verified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
                    </div>
                    <p className="text-xs text-muted-foreground">@{username}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/${username}`)}>
                  <CircleUser className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/bookmarks`)}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  <span>Bookmarks</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/settings`)}>
                  <Settings className="mr-2 h-4 w-4"/>
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='text-red-500 focus:text-red-600' onClick={signout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}