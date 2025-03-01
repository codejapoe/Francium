import { useEffect, useState } from "react";
import { useGoogleLogin } from '@react-oauth/google';
import { useParams, Link } from 'react-router-dom';
import Cookies from "js-cookie";
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { ID, Query } from "appwrite";
import bcrypt from "bcryptjs";
import { decryptPassword } from "@/lib/functions/password-manager";
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import Header from '../components/header';
import BottomNav from '../components/bottom-nav'
import Post from '../components/post'
import FollowSuggestions from '../components/follow-suggestions'
import { Copy, Loader2, Share, BadgeCheck, UserPlus, Edit2, Eye, CalendarDays, MapPin, LinkIcon, Mail, Phone, Briefcase, Cake, LayoutGrid, Repeat2, Contact, Bug, RotateCw, UserCheck, Star, UserX } from 'lucide-react'
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import RootLayout from "./layout";
import { FaGoogleDrive } from "react-icons/fa";
import { getCurrentUser, GoogleDriveLogin } from "@/lib/appwrite/api";
import { formatCount } from "@/lib/functions/count";
import { fetchUserDetails } from "@/lib/functions/user-functions";
import NotFoundError from './404';
import { messaging } from "../../../notifications/firebase.js"
import { onMessage } from "firebase/messaging";

export default function AccountProfile() {
  const { toast } = useToast()
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(undefined);
  const [isPostsLoading, setIsPostsLoading] = useState(undefined);
  const [isBtnLoading, setIsBtnLoading] = useState(undefined);
  const [userExists, setUserExists] = useState(true);
  const [currentUserID, setCurrentUserID] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [currentProfile, setCurrentProfile] = useState("");
  const [currentVerified, setCurrentVerified] = useState(false);
  const [currentFollowings, setCurrentFollowings] = useState([]);
  const [currentFavorites, setCurrentFavorites] = useState([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user_id, setUserID] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [verified, setVerified] = useState(false);
  const [cover, setCover] = useState("");
  const [bio, setBio] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [followers, setFollowers] = useState([]);
  const [followings, setFollowings] = useState([]);
  const [favors, setFavors] = useState([]);
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState([]);
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhNo] = useState("");
  const [occupation, setOccupation] = useState([]);
  const [birthday, setBirthday] = useState("");
  const [posts, setPosts] = useState([])
  const [reposts, setReposts] = useState([])
  const [tagged_posts, setTags] = useState([])
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [followed, setFollowed] = useState<boolean>(undefined);
  const [followerDetails, setFollowerDetails] = useState([]);
  const [followingDetails, setFollowingDetails] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerOpen2, setIsDrawerOpen2] = useState(false);
  const [repostUserDetails, setRepostUserDetails] = useState({});
  const [tagUserDetails, setTagUserDetails] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setIsPostsLoading(true);
        setIsBtnLoading(true);
        
        await verifyUser();
        setIsLoading(false);

        await fetchData();
        if (followers.includes(currentUserID)) {
          setFollowed(true);
        } else {
          setFollowed(false);
        }
      } finally {
        setIsBtnLoading(false);
        setIsPostsLoading(false);
      }
    };

    loadData();

    // Set access token if available
    const token = Cookies.get("access_token");
    if (token) {
      setAccessToken(token);
    }

    // Real-time update
    const intervalId = setInterval(fetchData, 1000);
    return () => clearInterval(intervalId);
  }, [id]);

  useEffect(() => {
    if (followers.length && currentUserID) {
      setFollowed(followers.includes(currentUserID));
    }
  }, [followers, currentUserID]);

  const fetchData = async() => {
    const response = await databases.listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      [
        Query.equal('username', id)
      ]
    );

    if (response.documents.length) {
      const userData = response.documents[0];
      setUserExists(true);
      setUserID(userData.$id);
      setUsername(userData.username);
      setEmail(userData.email);
      setName(userData.name);
      setProfile(userData.profile);
      setVerified(userData.verified);
      setCover(userData.cover);
      setBio(userData.bio);
      setFollowers(userData.followers || []);
      setFollowings(userData.followings || []);

      const [followerUsers, followingUsers] = await Promise.all([
        fetchUserDetails(userData.followers || []),
        fetchUserDetails(userData.followings || [])
      ]);

      setFollowerDetails(followerUsers);
      setFollowingDetails(followingUsers);
      setFavors(userData.favors || []);
      setLocation(userData.location);
      setWebsite(userData.website || []);
      setJoinDate(userData.$createdAt);
      setContactEmail(userData.contact_email);
      setPhNo(userData.contact_phno);
      setOccupation(userData.occupation || []);
      setBirthday(userData.birthday);

      // Handle posts with proper error handling
      try {
        if (userData.posts && userData.posts.length > 0) {
          const postsResponse = await databases.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.postCollectionID,
            [Query.equal('$id', userData.posts)]
          );
          setPosts(postsResponse.documents.reverse());
        } else {
          setPosts([]);
        }
      } catch (error) {
        setPosts([]);
      }

      // Handle reposts and tags in parallel
      const [repostResults, repostUserDetailsMap] = await Promise.all([
        Promise.all(
          (userData.reposts || []).map(repostID =>
            databases.getDocument(
              appwriteConfig.databaseID,
              appwriteConfig.postCollectionID,
              repostID
            ).catch(() => null)
          )
        ),
        Promise.all(
          (userData.reposts || []).map(async repostID => {
            try {
              const repost = await databases.getDocument(
                appwriteConfig.databaseID,
                appwriteConfig.postCollectionID,
                repostID
              );
              const [userDetail] = await fetchUserDetails([repost.user_id]);
              return { [repost.$id]: userDetail };
            } catch {
              return {};
            }
          })
        )
      ]);

      // Filter out null results and merge user details
      const validReposts = repostResults.filter(Boolean);
      const mergedRepostUserDetails = Object.assign({}, ...repostUserDetailsMap);
      setRepostUserDetails(mergedRepostUserDetails);
      setReposts(validReposts);

      // Handle tagged posts similarly
      const [tagResults, tagUserDetailsMap] = await Promise.all([
        Promise.all(
          response.documents[0].tagged_posts.map(tagID =>
            databases.getDocument(
              appwriteConfig.databaseID,
              appwriteConfig.postCollectionID,
              tagID
            ).catch(() => null)
          )
        ),
        Promise.all(
          response.documents[0].tagged_posts.map(async tagID => {
            try {
              const tag = await databases.getDocument(
                appwriteConfig.databaseID,
                appwriteConfig.postCollectionID,
                tagID
              );
              const [userDetail] = await fetchUserDetails([tag.user_id]);
              return { [tag.$id]: userDetail };
            } catch {
              return {};
            }
          })
        )
      ]);

      // Filter out null results and merge user details
      const validTags = tagResults.filter(Boolean);
      const mergedTagUserDetails = Object.assign({}, ...tagUserDetailsMap);
      setTagUserDetails(mergedTagUserDetails);
      setTags(validTags);
    } else {
      setUserExists(false);
    }
  }

  const verifyUser = async () => {
    const response = await getCurrentUser();
    if (response.$id) {
      setCurrentUserID(response.$id);
      setCurrentUsername(response.username);
      setCurrentName(response.name);
      setCurrentProfile(response.profile);
      setCurrentVerified(response.verified);
      setCurrentFollowings(response.followings);
      setCurrentFavorites(response.favorites);

      onMessage(messaging, (payload) => {
        toast({
          title: payload.notification.title,
          description: payload.notification.body,
          duration: 3000,
        });
      });
    }
  };

  const refreshPosts = () => {
    fetchData();
    toast({
      title: "Posts refreshed",
      description: "Check for new posts.",
      duration: 3000
    })
  }

  interface TokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
  }
  
  const GoogleDriveAuth = useGoogleLogin({
    onSuccess: async (tokenResponse: TokenResponse) => {
      try {
        const res = await GoogleDriveLogin(tokenResponse);
        if (res === 200) {
          const token = tokenResponse.access_token;
          setAccessToken(token);
          Cookies.set("access_token", token, { expires: 365 });
          toast({
            title: "Google Drive Connected",
            description: "You can now upload your photos.",
            duration: 3000
          })
        } else {
          toast({
            variant: "destructive",
            title: "Unable to sign into Google Drive",
            description: "Please put external links in caption.",
            duration: 3000
          })
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Unable to sign into Google Drive",
          description: "Please put external links in caption.",
          duration: 3000
        })
      }
    },
    onError: () => 
      toast({
        variant: "destructive",
        title: "Unable to sign into Google Drive",
        description: "Please put external links in caption.",
        duration: 3000
      }),
  });

  const searchFolder = async (folderName) => {
    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      const result = await response.json();
      if (result.files && result.files.length > 0) {
        return result.files[0].id;
      }
      return null;
    } catch (error) {
      throw error;
    }
  };
  
  const createFolder = async (folderName) => {
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
  
    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });
  
      const result = await response.json();
      return result.id;
    } catch (error) {
      throw error;
    }
  };

  const uploadFile = async (file, folderId, type) => {
      // Upload file first
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [folderId],
      };
    
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);
    
      try {
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        });
    
        const result = await response.json();
        
        // Make the file public
        await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone'
          })
        });
    
        // Update state and return the URL
        if (type === 'profile') {
          return `https://drive.google.com/thumbnail?authuser=0&sz=w800&id=${result.id}`;
        } else if (type === 'cover') {
          return `https://drive.google.com/thumbnail?authuser=0&sz=w1080&id=${result.id}`;
        }
      } catch (error) {
        throw error;
      }
    };

  const handleFileUpload = async (files: File[], type: string): Promise<string[]> => {
    try {
      let folderId = await searchFolder('Francium');
  
      if (!folderId) {
        folderId = await createFolder('Francium');
      }
  
      const uploadPromises = files.map((file) => uploadFile(file, folderId, type));
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      Cookies.remove('access_token');
      setAccessToken(undefined)
      toast({ title: "Failed to upload media", description: "Please sign into Google Drive again.", variant: "destructive" });
      throw error;
    }
  };

  const handleEditProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    setIsEditDialogOpen(false);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    try {
      let newProfileUrl = profile;
      let newCoverUrl = cover;

      // Handle file uploads first
      if (profileFile) {
        const [profileUrl] = await handleFileUpload([profileFile], 'profile');
        newProfileUrl = profileUrl;
      }
      if (coverFile) {
        const [coverUrl] = await handleFileUpload([coverFile], 'cover');
        newCoverUrl = coverUrl;
      }

      const contactEmail = formData.get('contact_email')?.toString() || '';
      // Only include contact_email if it's a valid email or empty
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const updateData = {
        username: formData.get('username'),
        name: formData.get('name'),
        bio: formData.get('bio'),
        location: formData.get('location'),
        website: formData.get('website')?.toString().replace(" ", "").split(',').filter(Boolean),
        contact_email: contactEmail && emailRegex.test(contactEmail) ? contactEmail : null,
        contact_phno: formData.get('phone'),
        occupation: formData.get('occupation')?.toString().replace(", ", ",").replace(" ,", ",").split(',').filter(Boolean),
        birthday: formData.get('birthday'),
        profile: newProfileUrl,
        cover: newCoverUrl
      };

      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id,
        updateData
      );
      
      await fetchData();
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update profile", description: "Please try again later.", variant: "destructive" });
    }
  };

  const follow = async () => {
    setFollowed(true);
    try {
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
            followings: [...new Set([user_id, ...currentFollowings])]
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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error following user",
        description: "Please try again later.",
        duration: 3000
      });
    }
  }

  const favorite = async () => {
    try {
      // Add current user to target user's favors
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id,
        {
          favors: [...new Set([currentUserID, ...favors])]
        }
      );

      // Add target user to current user's favorites
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        currentUserID,
        {
          favorites: [...new Set([user_id, ...currentFavorites])]
        }
      );

      toast({
        title: "Added to Favorites",
        description: "You will start seeing their posts in Favorites.",
        duration: 3000
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error adding to favorites",
        description: "Please try again later.",
        duration: 3000
      });
    }
  }

  const unfollow = async () => {
    setFollowed(false);
    
    await databases.updateDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      user_id,
      {
        followers: followers.filter(item => item !== user_id)
      }
    );

    await databases.updateDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      user_id,
      {
        followings: currentFollowings.filter(item => item !== user_id)
      }
    );
  }

  const handleUserClick = () => {
    setIsDrawerOpen(false);
  };

  const handleUserClick2 = () => {
    setIsDrawerOpen2(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col space-y-4 items-center justify-center">
        <Loader2 className="animate-spin" />
        Loading...
      </div>
    );
  }

  if (!userExists) {
    return <NotFoundError />;
  }

  return (
    <RootLayout>
      <div className="min-h-screen bg-background">
        <Header activeTab="#" username={currentUsername} name={currentName} profile={currentProfile} verified={currentVerified}/>
        <main className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center pb-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-foreground">Home</BreadcrumbLink>
                </BreadcrumbItem><BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Profile</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>@{id}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button size="icon" variant="outline" onClick={() => refreshPosts()}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative mb-12">
            <PhotoProvider>
              <PhotoView src={ cover || "https://placehold.co/3840x2160/020617/FFFFFF?text=2025+Francium+©+Codejapoe"}>
                <img
                  src={cover || "https://placehold.co/3840x2160/020617/FFFFFF?text=2025+Francium+©+Codejapoe"}
                  className="w-full h-48 object-cover lg:h-96 rounded-lg"
                  alt="Fr"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/3840x2160/020617/FFFFFF?text=2025+Francium+©+Codejapoe";
                  }}
                />
              </PhotoView>
            </PhotoProvider>
            <PhotoProvider>
              <PhotoView src={ profile }>
                <Avatar className="absolute bottom-0 left-4 transform translate-y-1/2 w-24 h-24 lg:w-30 lg:h-30 border-4 border-background">
                  <AvatarImage src={profile} alt={name} className="object-cover object-center"/>
                  <AvatarFallback>Fr</AvatarFallback>
                </Avatar>
              </PhotoView>
            </PhotoProvider>
          </div>
          <div className="flex justify-between items-start mb-4">
            <div className="ml-2">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">{name}</h1>
                {verified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
              </div>
              <p className="text-muted-foreground">@{username}</p>
            </div>
            
            <div className="hidden lg:flex items-end gap-2">
              { username != undefined ? (
                isBtnLoading ? (
                  <Button className="gap-2" disabled>
                    <Loader2 className="animate-spin" />
                    Loading
                  </Button>
                ) : currentUsername === id ? (
                  <Button onClick={() => setIsEditDialogOpen(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  followed != undefined ? (
                    followed === true ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="gap-2">
                            <UserCheck className="w-4 h-4" />
                            Following
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 text-center">
                          <DropdownMenuGroup>
                            <DropdownMenuItem className="gap-2" onClick={() => favorite()}>
                              <Star className="h-4 w-4" />
                              Favorites
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 focus:text-red-600 gap-2" onClick={() => unfollow()}>
                              <UserX className="h-4 w-4" />
                              Unfollow
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button className="gap-2" onClick={() => follow()}>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </Button>
                    )
                  ) : (
                    <Button className="gap-2" disabled>
                      <Loader2 className="animate-spin" />
                      Loading
                    </Button>
                  )
                )
              ) : (
                <Link to='/sign-in'>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </Button>
                </Link>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="outline">
                    <Share className="w-4 h-4"/>
                  </Button>
                </DialogTrigger>
                <DialogContent className="lg:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Share Profile</DialogTitle>
                    <DialogDescription>
                      Anyone who has this link will be able to view this.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <Label htmlFor="link" className="sr-only">
                        Link
                      </Label>
                      <Input
                        id="link"
                        defaultValue={`https://francium-app.web.app/${id}`}
                        readOnly
                      />
                    </div>
                    <Button type="submit" size="icon" onClick={() => {navigator.clipboard.writeText(`https://francium-app.web.app/${id}`); toast({title: "Copied to clipboard."});}}>
                      <span className="sr-only">Copy</span>
                      <Copy className="w-4 h-4"/>
                    </Button>
                  </div>
                  <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <p className="ml-2 mb-2">{bio}</p>
          <div className="md:w-1/3 flex items-start mb-2">
            <div className="flex gap-4">
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <div className="cursor-pointer hover:opacity-80 ml-2">
                    <span className="font-bold">{formatCount(followers.length || 0)}</span>{" "}
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                </DrawerTrigger>
                <DrawerContent className="bg-background max-h-[100%]">
                  <div className="mx-auto w-full max-w-md">
                    <DrawerHeader>
                      <DrawerTitle>Followers</DrawerTitle>
                      <DrawerDescription>People who follow @{username}</DrawerDescription>
                    </DrawerHeader>
                    <ScrollArea className="overflow-y-auto">
                      <div className="p-4 space-y-4">
                        { followers.length === 0 ? (
                          <p className="text-center text-muted-foreground">No followers yet</p>
                        ) : (
                          followerDetails.map((user) => (
                            <div key={user.$id} className="flex items-center gap-4">
                              <Link to={`/${user.username}`} onClick={handleUserClick}>
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={user.profile} />
                                  <AvatarFallback>Fr</AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <Link to={`/${user.username}`} className="font-semibold" onClick={handleUserClick}>
                                    {user.name}
                                  </Link>
                                  {user.verified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
                                </div>
                                <Link to={`/${user.username}`} onClick={handleUserClick}><p className="text-sm text-muted-foreground">@{user.username}</p></Link>
                              </div>
                            </div>
                          ))
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

              <Drawer open={isDrawerOpen2} onOpenChange={setIsDrawerOpen2}>
                <DrawerTrigger asChild>
                  <div className="cursor-pointer hover:opacity-80">
                    <span className="font-bold">{formatCount(followings.length || 0)}</span>{" "}
                    <span className="text-muted-foreground">Followings</span>
                  </div>
                </DrawerTrigger>
                <DrawerContent className="bg-background max-h-[100%]">
                  <div className="mx-auto w-full max-w-md">
                    <DrawerHeader>
                      <DrawerTitle>Followings</DrawerTitle>
                      <DrawerDescription>People that @{username} follows</DrawerDescription>
                    </DrawerHeader>
                    <ScrollArea className="overflow-y-auto">
                      <div className="p-4 space-y-4">
                        { followings.length === 0 ? (
                          <p className="text-center text-muted-foreground">Not following anyone yet</p>
                        ) : (
                          followingDetails.map((user) => (
                            <div key={user.$id} className="flex items-center gap-4">
                              <Link to={`/${user.username}`} onClick={handleUserClick2}>
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={user.profile} />
                                  <AvatarFallback>Fr</AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <Link to={`/${user.username}`} className="font-semibold" onClick={handleUserClick2}>
                                    {user.name}
                                  </Link>
                                  {user.verified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
                                </div>
                                <Link to={`/${user.username}`} onClick={handleUserClick2}><p className="text-sm text-muted-foreground">@{user.username}</p></Link>
                              </div>
                            </div>
                          ))
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
            </div>
          </div>
          <div className="mt-4 flex lg:hidden gap-2">
            { username == undefined ? (
              <Link to='/sign-in' className="w-full">
                <Button className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </Button>
              </Link>
            ) : (
              isBtnLoading ? (
                <Button className="w-full gap-2" disabled>
                  <Loader2 className="animate-spin" />
                    Loading
                </Button>
              ) : currentUsername === id ? (
                <Button className="w-full gap-2" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              ) : (
                followed != undefined ? (
                  followed === true ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full gap-2">
                          <UserCheck className="w-4 h-4" />
                          Following
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 text-center">
                        <DropdownMenuGroup>
                          <DropdownMenuItem className="gap-2" onClick={() => favorite()}>
                            <Star className="h-4 w-4" />
                            Favorites
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 focus:text-red-600 gap-2" onClick={() => unfollow()}>
                            <UserX className="h-4 w-4" />
                            Unfollow
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button className="w-full gap-2" onClick={() => follow()}>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </Button>
                  )
                ) : (
                  <Button className="w-full gap-2" disabled>
                    <Loader2 className="animate-spin" />
                      Loading
                  </Button>
                )
              )
            )}

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="lg:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditProfile}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Profile Picture</Label>
                      { accessToken == undefined ? (
                        <Button
                          variant="outline"
                          onClick={() => GoogleDriveAuth()}
                          className="w-full"
                        >
                          <FaGoogleDrive className="h-4 w-4 mr-2" />
                          <span>Sign in with Google Drive</span>
                        </Button>
                      ) : (
                        <Input
                          type="file"
                          name="profile_picture"
                          accept="image/*"
                          onChange={(e) => setProfileFile(e.target.files[0])}
                        />
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Cover Photo</Label>
                      { accessToken == undefined ? (
                        <Button
                          variant="outline"
                          onClick={() => GoogleDriveAuth()}
                          className="w-full"
                        >
                          <FaGoogleDrive className="h-4 w-4 mr-2" />
                          <span>Sign in with Google Drive</span>
                        </Button>
                      ) : (
                        <Input
                          type="file"
                          name="cover_photo"
                          accept="image/*"
                          onChange={(e) => setCoverFile(e.target.files[0])}
                        />
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" name="username" className="text-md" defaultValue={username} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" className="text-md" defaultValue={name} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input id="bio" name="bio" className="text-md" defaultValue={bio} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" className="text-md" defaultValue={location} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="website">Websites (comma-separated)</Label>
                      <Input id="website" name="website" className="text-md" defaultValue={website.join(',')} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input id="contact_email" name="contact_email" className="text-md" type="email" defaultValue={contactEmail} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" className="text-md" defaultValue={phone} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="occupation">Occupation (comma-separated)</Label>
                      <Input id="occupation" name="occupation" className="text-md" defaultValue={occupation.join(',')} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="birthday">Birthday</Label>
                      <Input id="birthday" name="birthday" className="text-md" type="date" defaultValue={birthday} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Details</DialogTitle>
                </DialogHeader>
                  <ul className="space-y-2">
                    { location && (
                      <li className="flex items-center">
                        <div className="flex-shrink-0">
                          <MapPin className="w-4 h-4 mr-2" />
                        </div>
                        <span className="break-all flex-1">{location}</span>
                      </li>
                    )}
                    { website && website.map((url, index) => (
                      <li key={index} className="flex items-center">
                        <div className="flex-shrink-0">
                          <LinkIcon className="w-4 h-4 mr-2" />
                        </div>
                        <a 
                          href={url.startsWith('http') ? url : `https://${url}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline break-all flex-1"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                    { contactEmail && (
                      <li className="flex items-center">
                        <div className="flex-shrink-0">
                          <Mail className="w-4 h-4 mr-2" />
                        </div>
                        <span className="break-all flex-1">{email}</span>
                      </li>
                    )}
                    { phone && (
                      <li className="flex items-center">
                        <div className="flex-shrink-0">
                          <Phone className="w-4 h-4 mr-2" />
                        </div>
                        <span className="break-all flex-1">{phone}</span>
                      </li>
                    )}
                    { occupation.map((job, index) => (
                      <li key={index} className="flex items-center">
                        <div className="flex-shrink-0">
                          <Briefcase className="w-4 h-4 mr-2" />
                        </div>
                        <span className="break-all flex-1">{job}</span>
                      </li>
                    ))}
                    { birthday && (
                      <li className="flex items-center">
                        <Cake className="w-4 h-4 mr-2" />
                        <span>{new Date(birthday).toLocaleDateString('en-US').replace(/\//g, '-')}</span>
                      </li>
                    )}
                    { joinDate && (
                    <li className="flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2" />
                      <span>Joined {new Date(joinDate).toLocaleDateString("en-US").replace(/\//g, "-")}</span>
                    </li>
                    )}
                  </ul>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" className="w-1/4 min-w-9" variant="outline">
                  <Share className="w-4 h-4"/>
                </Button>
              </DialogTrigger>
              <DialogContent className="lg:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Profile</DialogTitle>
                  <DialogDescription>
                    Anyone who has this link will be able to view this.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                  <div className="grid flex-1 gap-2">
                    <Label htmlFor="link" className="sr-only">
                      Link
                    </Label>
                    <Input
                      id="link"
                      defaultValue={`https://francium-app.web.app/${id}`}
                      readOnly
                    />
                  </div>
                  <Button type="submit" size="icon" onClick={() => {navigator.clipboard.writeText(`https://francium-app.web.app/${id}`); toast({title: "Copied to clipboard."});}}>
                    <span className="sr-only">Copy</span>
                    <Copy className="w-4 h-4"/>
                  </Button>
                </div>
                <DialogFooter className="sm:justify-start">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          </main>

          <div className="container mx-auto px-4 flex gap-8">
              <aside className="hidden lg:block w-1/4 sticky top-20 mb-4 self-start">
                <Card>
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      { location && (
                        <li className="flex items-center">
                          <div className="flex-shrink-0">
                            <MapPin className="w-4 h-4 mr-2" />
                          </div>
                          <span className="break-all flex-1">{location}</span>
                        </li>
                      )}
                      { website && website.map((url, index) => (
                        <li key={index} className="flex items-center">
                          <div className="flex-shrink-0">
                            <LinkIcon className="w-4 h-4 mr-2" />
                          </div>
                          <a 
                            href={url.startsWith('http') ? url : `https://${url}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline break-all flex-1"
                          >
                            {url}
                          </a>
                        </li>
                      ))}
                      { contactEmail && (
                        <li className="flex items-center">
                          <div className="flex-shrink-0">
                            <Mail className="w-4 h-4 mr-2" />
                          </div>
                          <span className="break-all flex-1">{email}</span>
                        </li>
                      )}
                      { phone && (
                        <li className="flex items-center">
                          <div className="flex-shrink-0">
                            <Phone className="w-4 h-4 mr-2" />
                          </div>
                          <span className="break-all flex-1">{phone}</span>
                        </li>
                      )}
                      { occupation.map((job, index) => (
                        <li key={index} className="flex items-center">
                          <div className="flex-shrink-0">
                            <Briefcase className="w-4 h-4 mr-2" />
                          </div>
                          <span className="break-all flex-1">{job}</span>
                        </li>
                      ))}
                      { birthday && (
                        <li className="flex items-center">
                          <Cake className="w-4 h-4 mr-2" />
                          <span>{new Date(birthday).toLocaleDateString('en-US').replace(/\//g, '-')}</span>
                        </li>
                      )}
                      { joinDate && (
                      <li className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        <span>Joined {new Date(joinDate).toLocaleDateString("en-US").replace(/\//g, "-")}</span>
                      </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </aside>
              <main className="w-full lg:w-1/2 pb-16 lg:pb-0">
                  <Tabs defaultValue="posts" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="posts" className="gap-2"><LayoutGrid className="w-4 h-4" /><span className="hidden md:block">Posts</span></TabsTrigger>
                        <TabsTrigger value="reposts" className="gap-2"><Repeat2 className="w-4 h-4" /><span className="hidden md:block">Reposts</span></TabsTrigger>
                        <TabsTrigger value="tags" className="gap-2"><Contact className="w-4 h-4" /><span className="hidden md:block">Tags</span></TabsTrigger>
                      </TabsList>
                      <TabsContent value="posts">
                      { isPostsLoading ? (
                        <div className="space-y-4 mt-4 mb-4">
                          <div className="p-4 space-y-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-[300px]" />
                            <Skeleton className="h-[200px] w-full rounded-lg" />
                            <div className="flex space-x-4">
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                            </div>
                          </div>
                        </div>
                      ) : posts.length === 0 ? (
                            <div className='mt-12'>
                              <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
                                <Bug className="w-24 h-24"/><br />
                                <h1 className='text-4xl font-bold leading-tight'>Nothing to see 👀</h1>
                                <p className='text-center text-muted-foreground mb-6'>
                                  Posts will appear here <br/> when @{username} creates a post.
                                </p>
                              </div>
                            </div>
                          ) : (
                            posts.map((post, index) => (
                              <Post key={index}
                              currentUserID={currentUserID}
                              currentUsername={currentUsername}
                              id={post.$id}
                              user_id={post.user_id}
                              name={name}
                              username={username}
                              profile={profile}
                              isVerified={verified}
                              timestamp={post.$createdAt}
                              caption={post.caption}
                              type={post.type}
                              files={post.files}
                              location={post.location} 
                              hashtags={post.hashtags} 
                              tagged_people={post.tagged_people} 
                              likes={post.likes} comments={post.comment} reposts={post.reposts} {...post} />
                            ))
                          )
                        }
                      </TabsContent>
                      <TabsContent value="reposts">
                      { isPostsLoading ? (
                        <div className="space-y-4 mt-4 mb-4">
                          <div className="p-4 space-y-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-[300px]" />
                            <Skeleton className="h-[200px] w-full rounded-lg" />
                            <div className="flex space-x-4">
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                            </div>
                          </div>
                        </div>
                      ) : reposts.length === 0 ? (
                        <div className='mt-12'>
                          <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
                            <Bug className="w-24 h-24"/><br />
                            <h1 className='text-4xl font-bold leading-tight'>Nothing to see 👀</h1>
                            <p className='text-center text-muted-foreground mb-6'>
                              Reposts will appear here <br/> when @{username} reposts.
                            </p>
                          </div>
                        </div>
                          ) : (
                            reposts.map((repost, index) => (
                              <Post 
                                key={index} 
                                currentUserID={currentUserID}
                                currentUsername={currentUsername}
                                id={repost.$id} 
                                user_id={repost.user_id} 
                                name={repostUserDetails[repost.$id]?.name} 
                                username={repostUserDetails[repost.$id]?.username} 
                                profile={repostUserDetails[repost.$id]?.profile} 
                                isVerified={repostUserDetails[repost.$id]?.verified} 
                                timestamp={repost.$createdAt} 
                                caption={repost.caption} 
                                type={repost.type} 
                                files={repost.files} 
                                location={repost.location} 
                                hashtags={repost.hashtags} 
                                tagged_people={repost.tagged_people} 
                                likes={repost.likes} 
                                comments={repost.comment} 
                                reposts={repost.reposts} 
                                {...repost} 
                              />
                            ))
                          )
                        }
                      </TabsContent>
                      <TabsContent value="tags">
                      { isPostsLoading ? (
                        <div className="space-y-4 mt-4 mb-4">
                          <div className="p-4 space-y-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-[300px]" />
                            <Skeleton className="h-[200px] w-full rounded-lg" />
                            <div className="flex space-x-4">
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                              <Skeleton className="h-8 w-16" />
                            </div>
                          </div>
                        </div>
                      ) : tagged_posts.length === 0 ? (
                        <div className='mt-12'>
                          <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
                            <Bug className="w-24 h-24"/><br />
                            <h1 className='text-4xl font-bold leading-tight'>Nothing to see 👀</h1>
                            <p className='text-center text-muted-foreground mb-6'>
                              Tags will appear here <br/> when @{username} is tagged in a post.
                            </p>
                          </div>
                        </div>
                          ) : (
                            tagged_posts.map((tag, index) => (
                              <Post 
                                key={index} 
                                currentUserID={currentUserID}
                                currentUsername={currentUsername}
                                id={tag.$id} 
                                user_id={tag.user_id} 
                                name={tagUserDetails[tag.$id]?.name} 
                                username={tagUserDetails[tag.$id]?.username} 
                                profile={tagUserDetails[tag.$id]?.profile} 
                                isVerified={tagUserDetails[tag.$id]?.verified} 
                                timestamp={tag.$createdAt} 
                                caption={tag.caption} 
                                type={tag.type} 
                                files={tag.files} 
                                location={tag.location} 
                                hashtags={tag.hashtags} 
                                tagged_people={tag.tagged_people} 
                                likes={tag.likes} 
                                comments={tag.comment} 
                                reposts={tag.reposts} 
                                {...tag} 
                              />
                            ))
                          )
                        }
                      </TabsContent>
                  </Tabs>
              </main>
              <aside className="hidden lg:block w-1/4 sticky top-20 self-start">
                <div className="space-y-6">
                  <FollowSuggestions />
                  <p className='pl-4 text-sm text-muted-foreground'>2025 Francium © Codejapoe <br/><a href="https://www.codejapoe.xyz" target='_blank'>www.codejapoe.xyz</a></p>
                </div>
              </aside>
          </div>
          <BottomNav user_id={user_id} username={currentUsername} name={currentName} profile={currentProfile} verified={currentVerified}/>
      </div>
    </RootLayout>
  )
}