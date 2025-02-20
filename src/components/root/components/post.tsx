import { client } from "@/lib/appwrite/config"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import { Heart, MessageCircle, Repeat2, Bookmark, BadgeCheck, MoreHorizontal, LinkIcon, Info, Trash2, CircleAlert, Users, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { getRelativeTime } from '@/lib/functions/count'
import { useState, useEffect, useRef } from 'react'
import { databases } from "@/lib/appwrite/config"
import { appwriteConfig } from "@/lib/appwrite/config"
import { ID } from 'appwrite'
import Cookies from "js-cookie"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerFooter } from "@/components/ui/drawer"
import { fetchUserDetails } from "@/lib/functions/user-functions";
import { useLongPress } from "@uidotdev/usehooks";
import { Loader2 } from 'lucide-react';
import { formatCount } from '@/lib/functions/count'
import { Textarea } from "@/components/ui/textarea"
import { useToast } from '@/components/ui/use-toast'
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface PostProps {
  currentUserID: string
  currentUsername: string
  id: string
  user_id: string
  name: string
  username: string
  profile: string
  isVerified?: boolean
  timestamp: string
  caption: string
  type: string
  files: string[]
  location: string
  hashtags: string[]
  tagged_people: string[]
  likes: string[]
  comments: string[]
  reposts: string[]
  repost_user_data?: {
    name: string;
    username: string;
    profile: string;
    verified: boolean;
  } | null;
  tagged_user_data?: {
    name: string;
    username: string;
    profile: string;
    verified: boolean;
  } | null;
}

export default function Post({ currentUserID, currentUsername, id, user_id, name, username, profile, isVerified = false, timestamp, caption, type, files, location, hashtags, tagged_people, likes, comments, reposts, repost_user_data=null, tagged_user_data=null }: PostProps) {
  const userID = Cookies.get('user_id');
  const { toast } = useToast()
  const [isLiked, setIsLiked] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [commentUsers, setCommentUsers] = useState([]);
  const [commentsList, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const [isRepostDrawerOpen, setIsRepostDrawerOpen] = useState(false);
  const [repostedUsers, setRepostedUsers] = useState([]);
  const [isLoadingReposts, setIsLoadingReposts] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [commentLength, setCommentLength] = useState(0);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const formatCaption = (text: string) => {
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^(https?:\/\/[^\s]+)/)) {
        return (
          <a 
            key={index}
            href={word}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {word}
          </a>
        );
      }
      else if (word.startsWith('#')) {
        return (
          <Link
            key={index}
            to={`/hashtag/${word.slice(1)}`}
            className="text-blue-500 hover:underline"
          >
            {word}
          </Link>
        );
      }
      else if (word.startsWith('@')) {
        return (
          <Link
            key={index}
            to={`/${word.slice(1)}`}
            className="text-blue-500"
          >
            {word}
          </Link>
        );
      }
      return word;
    });
  };

  const longPressProps = useLongPress(() => {
    handleShowLikes();
  }, {
    threshold: 500,
  });

  const repostLongPressProps = useLongPress(() => {
    handleShowReposts();
  }, {
    threshold: 500,
  });

  const handleShowLikes = async () => {
    if (likes.length === 0) return;
    
    setIsDrawerOpen(true);
    setIsLoadingUsers(true);
    try {
      const users = await Promise.all(await fetchUserDetails(likes));
      setLikedUsers(users);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: "Please try again later.",
        duration: 3000
      })
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleLike = async () => {
    if (!userID) return;

    setIsLiked(!isLiked);

    const updatedLikes = isLiked
      ? likes.filter(id => id !== userID)
      : [...new Set([userID, ...likes])];

    databases.updateDocument(
      appwriteConfig.databaseID,
      appwriteConfig.postCollectionID,
      id,
      { likes: updatedLikes }
    ).catch(error => {
      toast({
        variant: "destructive",
        title: "Error fetching likes",
        description: "Please try again later.",
        duration: 3000
      })
      setIsLiked(isLiked);
    });

    // Send notification
    await fetch('https://francium-notification.onrender.com/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: currentUsername,
        userID: user_id
      })
    });

    const notificationID = ID.unique();
    await databases.createDocument(
      appwriteConfig.databaseID,
      appwriteConfig.notificationCollectionID,
      notificationID,
      {
        user_id: currentUserID,
        description: currentUsername + " liked your post.",
        action_id: id,
        type: "like",
      }
    );

    // Get user's current notifications and update
    const userData = await databases.getDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      user_id
    );

    const currentNotifications = userData.notifications || [];
    await databases.updateDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      user_id,
      {
        notifications: [notificationID, ...currentNotifications]
      }
    );
  };

  useEffect(() => {
    // Subscribe to real-time updates for this post's comments
    const unsubscribe = client.subscribe(`databases.${appwriteConfig.databaseID}.collections.${appwriteConfig.postCollectionID}.documents.${id}`, 
      async response => {
        if (response.payload && typeof response.payload === 'object' && 'comments' in response.payload && Array.isArray(response.payload.comments)) {
          // Fetch all comments from the comments collection
          const commentPromises = response.payload.comments.map(commentId => 
            databases.getDocument(
              appwriteConfig.databaseID,
              appwriteConfig.commentCollectionID,
              commentId
            )
          );
          
          const commentDocs = await Promise.all(commentPromises);
          
          // Extract user IDs from comments and fetch user details
          const userIds = commentDocs.map(comment => comment.user_id);
          const users = await fetchUserDetails(userIds);
          
          setCommentUsers(users);
          setComments(commentDocs);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [id]);

  const handleShowComments = async () => {
    setIsCommentDrawerOpen(true);
    setIsLoadingComments(true);
    try {
      // Check if comments exist and is an array
      if (!comments || !Array.isArray(comments) || comments.length === 0) {
        setCommentUsers([]);
        setComments([]);
        setIsLoadingComments(false);
        return;
      }
      
      // Fetch all comments from the comments collection
      const commentPromises = comments.map(commentId => 
        databases.getDocument(
          appwriteConfig.databaseID,
          appwriteConfig.commentCollectionID,
          commentId
        )
      );
      
      const commentDocs = await Promise.all(commentPromises);
      
      // Extract user IDs from comments and fetch user details
      const userIds = commentDocs.map(comment => comment.user_id);
      const users = await fetchUserDetails(userIds);
      
      setCommentUsers(users);
      setComments(commentDocs);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading comments",
        description: "Please try again later.",
        duration: 3000
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleComment = async () => {
    if (!userID || !commentRef.current?.value.trim()) return;

    const newComment = {
      user_id: userID,
      content: commentRef.current.value.trim(),
    };

    const commentID = ID.unique();
    await databases.createDocument(
      appwriteConfig.databaseID,
      appwriteConfig.commentCollectionID,
      commentID,
      newComment
    );

    // Initialize comments array if undefined and maintain array structure
    const existingComments = Array.isArray(comments) ? comments : [];
    const newComments = [commentID, ...existingComments];

    commentRef.current.value = '';
    
    try {
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.postCollectionID,
        id,
        { comments: newComments }
      );
      
      // Send notification
      await fetch('https://francium-notification.onrender.com/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUsername,
          userID: user_id
        })
      });

      const notificationID = ID.unique();
      await databases.createDocument(
        appwriteConfig.databaseID,
        appwriteConfig.notificationCollectionID,
        notificationID,
        {
          user_id: currentUserID,
          description: currentUsername + " commented on your post.",
          action_id: id,
          type: "comment",
        }
      );

      // Get user's current notifications and update
      const userData = await databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id
      );

      const currentNotifications = userData.notifications || [];
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id,
        {
          notifications: [notificationID, ...currentNotifications]
        }
      );
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error posting comment",
        description: "Please try again later.",
        duration: 3000
      });
    }
  };

  const handleUserClick = () => {
    setIsCommentDrawerOpen(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  const handleShowReposts = async () => {
    if (!reposts || reposts.length === 0) return;
    
    setIsRepostDrawerOpen(true);
    setIsLoadingReposts(true);
    try {
      const users = await fetchUserDetails(reposts);
      setRepostedUsers(users);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: "Please try again later.",
        duration: 3000
      })
    } finally {
      setIsLoadingReposts(false);
    }
  };

  const handleRepost = async () => {
    if (!userID) return;

    try {
      const currentReposts = reposts || [];
      const updatedReposts = isReposted
        ? currentReposts.filter(uid => uid !== userID)
        : [...new Set([userID, ...currentReposts])];

      // Update post's reposts
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.postCollectionID,
        id,
        { reposts: updatedReposts }
      );

      // Get and update user's reposts
      const userData = await databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        userID
      );

      const userReposts = userData.reposts || [];
      const updatedUserReposts = isReposted
        ? userReposts.filter(postId => postId !== id)
        : [id, ...userReposts];

      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        userID,
        { reposts: updatedUserReposts }
      );

      setIsReposted(!isReposted);
      
      if (!isReposted) {
        toast({
          title: "Repost shared",
          description: "Your followers will see this post.",
          duration: 3000
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating repost",
        description: "Please try again later.",
        duration: 3000
      });
    }

    // Send notification
    await fetch('https://francium-notification.onrender.com/repost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: currentUsername,
        userID: user_id
      })
    });

    const notificationID = ID.unique();
    await databases.createDocument(
      appwriteConfig.databaseID,
      appwriteConfig.notificationCollectionID,
      notificationID,
      {
        user_id: currentUserID,
        description: currentUsername + " reposted your post.",
        action_id: id,
        type: "repost",
      }
    );

    // Get user's current notifications and update
    const userData = await databases.getDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      user_id
    );

    const currentNotifications = userData.notifications || [];
    await databases.updateDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      user_id,
      {
        notifications: [notificationID, ...currentNotifications]
      }
    );
  };

  const deletePost = async () => {
    try {
      // Delete the post document
      await databases.deleteDocument(
        appwriteConfig.databaseID,
        appwriteConfig.postCollectionID,
        id
      );

      // Get user document to update posts array
      const userData = await databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id
      );

      // Remove the post ID from user's posts array
      const updatedPosts = userData.posts.filter(postId => postId !== id);

      // Update user document
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id,
        {
          posts: updatedPosts
        }
      );

      toast({
        title: "Post deleted",
        description: "Your post has been successfully deleted.",
        duration: 3000
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting post",
        description: "Something went wrong. Please try again later.",
        duration: 3000
      });
    }
  };

  const reportPost = async () => {
    try {
      // Get user document to update posts array
      const userData = await databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        '679ffab900354e87a95f'
      );

      // Remove the post ID from user's posts array
      const updatedPosts = [id, ...userData.posts]

      // Update user document
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id,
        {
          posts: updatedPosts
        }
      );

      toast({
        title: "Post reported",
        description: "This post will be reviewed and deleted if needed.",
        duration: 3000
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error reporting post",
        description: "Something went wrong. Please try again later.",
        duration: 3000
      });
    }
  };

  useEffect(() => {
    setIsLiked(likes?.length === 0 ? false : likes?.includes(userID));
    setIsReposted(reposts?.length === 0 ? false : reposts?.includes(userID));
  }, []);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!userID) return;
      try {
        const userData = await databases.getDocument(
          appwriteConfig.databaseID,
          appwriteConfig.userCollectionID,
          userID
        );
        setIsBookmarked(userData.bookmarks?.includes(id) || false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching bookmarks",
          description: "Please sign in.",
          duration: 3000
        });
      }
    };
    checkBookmarkStatus();
  }, [id, userID]);
  
  // Add this function with other handlers
  const handleBookmark = async () => {
    if (!userID) return;
  
    try {
      const userData = await databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        userID
      );
  
      const currentBookmarks = userData.bookmarks || [];
      const updatedBookmarks = isBookmarked
        ? currentBookmarks.filter(bookmarkId => bookmarkId !== id)
        : [id, ...currentBookmarks];
  
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        userID,
        { bookmarks: updatedBookmarks }
      );
  
      setIsBookmarked(!isBookmarked);
      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        duration: 3000
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating bookmarks",
        description: "Please try again later.",
        duration: 3000
      });
    }
  };

  /*
  const follow = async () => {
  try {
    // First, get both users' data to access their current followers and followings
    const [targetUser, currentUser] = await Promise.all([
      databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id
      ),
      databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        currentUserID
      )
    ]);

    const followers = targetUser.followers || [];
    const followings = currentUser.followings || [];

    const [
      notificationID,
      userData
    ] = await Promise.all([
      // Update followers
      databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id,
        {
          followers: [...new Set([currentUserID, ...followers])]
        }
      ),
      // Update followings
      databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        currentUserID,
        {
          followings: [...new Set([user_id, ...followings])]
        }
      ),
      // Create notification document
      databases.createDocument(
        appwriteConfig.databaseID,
        appwriteConfig.notificationCollectionID,
        ID.unique(),
        {
          user_id: currentUserID,
          description: currentUsername + " started following you.",
          action_id: currentUserID,
          type: "follow",
        }
      ),
      // Get user's current notifications
      databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id
      )
    ]);

    // Send notification to server
    try {
      fetch('https://francium-notification.onrender.com/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUsername,
          userID: user_id
        })
      });
    } catch (error) {}

    // Update notifications array
    const currentNotifications = userData.notifications || [];
    await databases.updateDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      user_id,
      {
        notifications: [notificationID.$id, ...currentNotifications]
      }
    );

    toast({
      title: "Followed successfully",
      description: `You will start seeing @${username}'s posts on your feed.`,
      duration: 3000
    });
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error following user",
      description: "Please try again later.",
      duration: 3000
    });
  }
}*/

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="space-y-4">
          {repost_user_data && 
            <div className="flex items-center space-x-2">
              <Repeat2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{repost_user_data.name} reposted.</p>
            </div>
          }
          {tagged_user_data && 
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{tagged_user_data.name} is tagged.</p>
            </div>
          }
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Link to={'/' + username}>
              <Avatar>
                <AvatarImage src={profile} alt={name} className='object-cover object-center'/>
                <AvatarFallback>Fr</AvatarFallback>
              </Avatar>
              </Link>
              <div>
                <div className="flex items-center">
                  <p className="font-medium">{name}</p>
                  {isVerified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-2" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  @<Link to={'/' + username}>{username}</Link> · {getRelativeTime(timestamp)}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {window.location.href = `https://francium-app.web.app/post/${id}`}}>
                  <Eye className="w-4 h-4 mr-2" />
                  View post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {navigator.clipboard.writeText(`https://francium-app.web.app/post/${id}`); toast({title: "Copied to clipboard."});}}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowInfoDialog(true)}>
                  <Info className="w-4 h-4 mr-2" />
                  Show info
                </DropdownMenuItem>
                { userID === user_id || Cookies.get('user_id') === '679ffab900354e87a95f' || Cookies.get('user_id') === '677529e00000cdcfe556' ? (
                  <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={deletePost}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={reportPost}>
                    <CircleAlert className="w-4 h-4 mr-2"></CircleAlert>
                    Report post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-2 whitespace-pre-wrap">{formatCaption(caption)}</p>
          {files.length > 1 && type === "post" && (
            <PhotoProvider>
              <ScrollArea className="w-full whitespace-nowrap rounded-md">
                <div className="flex w-max space-x-4 py-4">
                  {files.map((file, index) => (
                    <PhotoView src={ file }>
                      <figure key={index} className="shrink-0">
                        <div className="overflow-hidden rounded-md">
                          <img
                            src={file}
                            alt={`Media ${index + 1}`}
                            className="aspect-square h-64 w-64 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/600x600/020617/FFFFFF?text=Click+to+view+the+file";
                            }}
                          />
                        </div>
                      </figure>
                    </PhotoView>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </PhotoProvider>
          )}
          {files.length === 1 && type === "post" && (
            <AspectRatio ratio={16 / 9}>
              <iframe 
                src={`${files[0]}`}
                allow="autoplay; fullscreen" 
                allowFullScreen 
                className="w-full h-full rounded-md"
              />
            </AspectRatio>
          )}
          {files && type === "carousel" && (
            <PhotoProvider>
              <div className="group relative">
                <Carousel className="w-full">
                  <CarouselContent>
                    {files.map((file, index) => (
                      <CarouselItem key={index}>
                        <PhotoView src={file}>
                          <div className="relative aspect-square">
                            <img
                              src={file}
                              alt={`Media ${index + 1}`}
                              className="absolute inset-0 h-full w-full object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/600x600/020617/FFFFFF?text=Click+to+view+the+file";
                              }}
                            />
                          </div>
                        </PhotoView>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            </PhotoProvider>
          )}
          {files && type === "reel" && (
            <AspectRatio ratio={9 / 16}>
              <iframe src={`${files[0]}`} allow="autoplay; fullscreen" allowFullScreen className="object-cover w-full h-full"></iframe>
            </AspectRatio>
          )}
        </CardContent>
        <CardFooter className='pb-4'>
          <div className="flex justify-between w-full">
            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`px-2 ${isLiked ? 'text-red-500 hover:text-red-600' : ''} select-none`}
                      onClick={handleLike}
                      {...longPressProps}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                      {formatCount(likes?.length || 0)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isLiked ? 'Unlike' : 'Like'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="px-2"
                      onClick={handleShowComments}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {formatCount(comments?.length || 0)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Comment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`px-2 ${isReposted ? 'text-green-500 hover:text-green-600' : ''} select-none`}
                      onClick={handleRepost}
                      {...repostLongPressProps}
                    >
                      <Repeat2 className={`h-4 w-4 mr-1 ${isReposted ? '' : ''}`} />
                      {formatCount(reposts?.length || 0)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isReposted ? 'Undo Repost' : 'Repost'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleBookmark}
                      className={isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : ''}
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isBookmarked ? 'Remove bookmark' : 'Bookmark'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Information</DialogTitle>
            <DialogDescription>Details about this post</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {location && (
              <div>
                <h4 className="text-sm font-medium mb-1">Location</h4>
                <p className="text-sm text-muted-foreground">{location}</p>
              </div>
            )}
            {hashtags && hashtags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag, index) => (
                    <Link key={index} to={`/hashtags/${tag}`} className="text-sm text-blue-500">
                      <span key={index} className="text-sm text-blue-500">#{tag}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {tagged_people && tagged_people.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Tagged Users</h4>
                <div className="flex flex-wrap gap-2">
                  {tagged_people.map((username, index) => (
                    <Link key={index} to={`/${username}`} className="text-sm text-blue-500">
                      @{username}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {(!location && (!hashtags || hashtags.length === 0) && (!tagged_people || tagged_people.length === 0)) && (
              <p className="text-sm text-muted-foreground">No additional information available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className='bg-background max-h-[90%]'>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <DrawerTitle>Likes</DrawerTitle>
              <DrawerDescription>People who liked this post</DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="h-[70vh]">
              <div className="p-4">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin w-8 h-8" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {likedUsers.map((user) => (
                      <div key={user.$id} className="flex items-center gap-4">
                        <Link to={`/${user.username}`}>
                          <Avatar>
                            <AvatarImage src={user.profile} alt={user.name} className="object-cover"/>
                            <AvatarFallback>Fr</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Link to={`/${user.username}`} className="font-semibold">
                              {user.name}
                            </Link>
                            {user.verified && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <BadgeCheck className="h-4 w-4 text-blue-500 ml-1" />
                                  </TooltipTrigger>
                                  <TooltipContent>Verified</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <Link to={`/${user.username}`}>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isCommentDrawerOpen} onOpenChange={setIsCommentDrawerOpen}>
        <DrawerContent className='bg-background max-h-[100%]'>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <DrawerTitle>Comments</DrawerTitle>
              <DrawerDescription>Join the conversation</DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="h-[50vh]">
              {isLoadingComments ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="animate-spin w-8 h-8" />
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {commentsList.length === 0 ? (
                    <p className="text-center text-muted-foreground">No comments yet. Be the first to comment!</p>
                  ) : (
                    commentUsers.map((user, index) => {
                      const comment = commentsList[index];
                      return (
                        <div key={comment.$id} className="flex items-start gap-4">
                          <Link to={`/${user.username}`} onClick={handleUserClick}>
                            <Avatar>
                              <AvatarImage src={user.profile} alt={user.name} className="object-cover"/>
                              <AvatarFallback>Fr</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link to={`/${user.username}`} onClick={handleUserClick} className="font-semibold hover:underline">
                                {user.name}
                              </Link>
                              {user.verified && (
                                <BadgeCheck className="h-4 w-4 text-blue-500" />
                              )}
                              <span className="text-md text-muted-foreground">·</span>
                              <span className="text-sm text-muted-foreground">
                                {getRelativeTime(comment.$createdAt)}
                              </span>
                            </div>
                            <p className="text-md mt-1 whitespace-pre-wrap break-words">
                              {formatCaption(comment.content)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </ScrollArea>
            <DrawerFooter className="border-t pt-4">
              <div className="flex flex-col gap-2">
                <Textarea
                  ref={commentRef}
                  placeholder="Write a comment..."
                  className="flex-1 text-md"
                  maxLength={5000}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setCommentLength(e.target.value.length)}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {commentLength}/5000
                  </span>
                  <Button 
                    onClick={handleComment}
                    disabled={!commentRef.current?.value.trim()}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isRepostDrawerOpen} onOpenChange={setIsRepostDrawerOpen}>
        <DrawerContent className='bg-background max-h-[90%]'>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <DrawerTitle>Reposts</DrawerTitle>
              <DrawerDescription>People who reposted this post</DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="h-[70vh]">
              <div className="p-4">
                {isLoadingReposts ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin w-8 h-8" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {repostedUsers.map((user) => (
                      <div key={user.$id} className="flex items-center gap-4">
                        <Link to={`/${user.username}`}>
                          <Avatar>
                            <AvatarImage src={user.profile} alt={user.name} className="object-cover"/>
                            <AvatarFallback>Fr</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <Link to={`/${user.username}`} className="font-semibold">
                              {user.name}
                            </Link>
                            {user.verified && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <BadgeCheck className="h-4 w-4 text-blue-500 ml-1" />
                                  </TooltipTrigger>
                                  <TooltipContent>Verified</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <Link to={`/${user.username}`}>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}