import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react'
import { Home, Bell, CircleUser, Compass, Bookmark, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { BadgeCheck } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import PostDrawer from './post-drawer';
import Cookies from 'js-cookie';
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { Query } from 'appwrite';
import { fetchUserDetails } from '@/lib/functions/user-functions';
import { Loader2, MoreVertical, Eye, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getRelativeTime } from '@/lib/functions/count';

export default function SideNav({ username, name, profile, verified }) {
  const user_id = Cookies.get('user_id');
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Compass, label: 'Explore', href: '/explore' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: CircleUser, label: 'Profile', href: `/${username}` },
    ...(localStorage.getItem('bookmarks') === "true" ? [] : [{ icon: Bookmark, label: 'Bookmarks', href: '/bookmarks' }]),
    ...(localStorage.getItem('settings') === "true" ? [] : [{ icon: Settings, label: 'Settings', href: '/settings' }]),
  ]
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user_id && isNotificationOpen) {
        try {
          const response = await databases.getDocument(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            user_id
          );

          const notifications2 = await databases.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.notificationCollectionID,
            [
              Query.equal('$id', response.notifications),
              Query.orderDesc('$createdAt'),
              Query.limit(25),
              Query.offset((page - 1) * 25)
            ]
          );

          const notificationsWithUserData = await Promise.all(
            notifications2.documents.map(async (notification) => {
              const userData = await fetchUserDetails([notification.user_id]);
              return { ...notification, user_data: userData[0] };
            })
          );

          setHasMore(notifications2.documents.length === 25);
          setNotifications(prev => page === 1 ? notificationsWithUserData : [...prev, ...notificationsWithUserData]);
        } catch (error) {
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchNotifications();
  }, [user_id, isNotificationOpen, page]);

  const deleteNotification = async (notificationId) => {
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id
      );
  
      const updatedNotifications = response.notifications.filter(id => id !== notificationId);
  
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id,
        { notifications: updatedNotifications }
      );
  
      setNotifications(prev => prev.filter(n => n.$id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <nav>
      { Cookies.get('email') != undefined ? (
        <div className="hidden lg:flex items-center space-x-3 mb-4 px-2">
          <Avatar>
            <AvatarImage src={profile} alt="User" className='object-cover object-center' />
            <AvatarFallback>Fr</AvatarFallback>
          </Avatar>
          <div className="">
            <div className="flex items-center">
              <p className="font-medium">{name}</p>
              {verified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
            </div>
            <p className="text-xs text-muted-foreground">@{username}</p>
          </div>
        </div>
        ) : (
          <div className="hidden lg:flex items-center space-x-3 mb-4 px-2">
          <Avatar>
            <AvatarImage src={profile} alt="User" className='object-cover object-center' />
            <AvatarFallback>Fr</AvatarFallback>
          </Avatar>
          <div className="">
            <div className="flex items-center">
              <p className="font-medium">Guest User</p>
            </div>
            <p className="text-xs text-muted-foreground">@guest</p>
          </div>
        </div>
        )
      }
      {navItems.map((item) => (
        item.label === 'Notifications' ? (
          <Sheet key={item.label} open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <SheetTrigger asChild className='space-y-0'>
              <Button 
                variant="ghost" 
                className="my-0 w-full justify-start"
                disabled={!user_id && item.label === 'Notifications'}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span className="xl:inline">{item.label}</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[725px] w-auto no-border pr-4">
                <div className="mt-4 space-y-4">
                { isLoading && page === 1 ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin w-8 h-8" />
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.$id} className="flex items-start justify-between space-x-4 p-2 rounded-lg hover:bg-accent">
                      <Link 
                        to={notification.type === 'follow' 
                          ? `/${notification.user_data?.username}`
                          : `/post/${notification.action_id}`} 
                        className="flex justify-between flex-1"
                      >
                      <div className="flex space-x-4">
                      <Avatar>
                          <AvatarImage 
                            src={notification.user_data?.profile} 
                            alt={notification.user_data?.name || 'Unknown User'} 
                            className="object-cover" 
                          />
                          <AvatarFallback>Fr</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">{notification.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {getRelativeTime(notification.$createdAt)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className='gap-2'>
                            <Eye className="w-4 h-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500 focus:text-red-600 gap-2" 
                            onClick={(e) => {
                              e.preventDefault();
                              deleteNotification(notification.$id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </Link>
                    </div>
                  ))
                )}
                </div>
                {!isLoading && hasMore && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4" 
                    onClick={loadMore}
                  >
                    Load More
                  </Button>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        ) : (
          <Link 
            key={item.label}
            to={user_id ? item.href : '/explore'}
            onClick={() => {
              if (!user_id && item.label !== 'Explore') {
                return;
              }
              if (location.pathname === item.href) {
                scrollToTop();
                window.location.reload();
              }
            }} 
          >
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              disabled={!user_id && item.label !== 'Explore'}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span className="xl:inline">{item.label}</span>
            </Button>
          </Link>
        )
      ))}
      <PostDrawer username={username} name={name} profile={profile} verified={verified} />
    </nav>
  )
}