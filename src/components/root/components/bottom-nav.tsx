import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react'
import { Home, Bell, CircleUser, Compass, Bookmark, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import PostDrawer from './post-drawer';
import Cookies from 'js-cookie';
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { Query } from 'appwrite';
import { fetchUserDetails } from '@/lib/functions/user-functions';
import { Loader2, MoreVertical, SquarePen } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getRelativeTime } from '@/lib/functions/count';

export default function BottomNav({ username, name, profile, verified }) {
  const location = useLocation();
  const user_id = Cookies.get('user_id');
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Compass, label: 'Explore', href: '/explore' },
    { icon: SquarePen, label: 'Post', href: '/create' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: CircleUser, label: 'Profile', href: `/${username}` },
  ]

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

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <nav className={`lg:hidden fixed bottom-0 left-0 right-0 navbar-alt border-t border-border bg-background dark:bg-background`}>
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          item.label === 'Post' ? (
            <PostDrawer username={username} name={name} profile={profile} verified={verified} />
          ) : item.label === 'Notifications' ? (
            <Sheet key={item.label} open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <SheetTrigger asChild className='space-y-0'>
                <Button 
                  variant="ghost" 
                  size="icon"
                  disabled={!user_id && item.label === 'Notifications'}
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
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
                          className="flex justify-between flex-1 cursor-pointer"
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
                            <DropdownMenuItem>
                              <Link to={`/post/${notification.post_id}`}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
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
                size="icon"
                disabled={!user_id && item.label !== 'Explore'}
              >
                <item.icon className="h-5 w-5"/>
                <span className="sr-only">{item.label}</span>
              </Button>
            </Link>
          )
        ))}
      </div>
    </nav>
  )
}