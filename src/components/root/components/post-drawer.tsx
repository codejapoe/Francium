import { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { ID, Query } from 'appwrite';
import Cookies from "js-cookie";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { FaGoogleDrive } from "react-icons/fa";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MapPin, Hash, Users, SquarePen, Image, BadgeCheck, Clapperboard, GalleryVertical, Info } from 'lucide-react';
import { GoogleDriveLogin } from "@/lib/appwrite/api";
import { appwriteConfig, databases } from "@/lib/appwrite/config";

interface PostDialogueProps {
  user_id: string,
  username: string,
  name: string,
  profile: string,
  verified: boolean
}

export default function PostDrawer({ user_id, username, name, profile, verified }: PostDialogueProps ) {
  const { toast } = useToast()
  const [isPostDrawerOpen, setPostDrawerOpen] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [activeTab, setActiveTab] = useState("post");
  const [files, setFiles] = useState<File[]>([]);
  let fileLinks = [];
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tag, setTag] = useState("");
  const [people, setPeople] = useState("");

  useEffect(() => {
    if (isPostDrawerOpen) {
      if (Cookies.get("access_token")) {
        setAccessToken(Cookies.get("access_token"))
      } else {
        setAccessToken(undefined)
        toast({
          variant: "destructive",
          title: "Google Drive token expired",
          description: "Please sign in again.",
          duration: 3000
        })
      }
    }
  }, [Cookies, isPostDrawerOpen]);
  
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
          setAccessToken(Cookies.get("access_token"))
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

  const uploadFile = async (file, folderId) => {
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
        try {
          const permissionResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              role: 'reader',
              type: 'anyone',
              allowFileDiscovery: false
            })
          });

          if (!permissionResponse.ok) {
            throw new Error('Failed to set file permissions. Please sign in again.');
          }
        } catch (error) {
          throw new Error('Failed to make file public. Please sign in again.');
        }
    
        if (file.type.startsWith('image/')) {
          fileLinks.push(`https://drive.google.com/thumbnail?authuser=0&sz=w1080&id=${result.id}`);
        } else if (file.type.startsWith('video/')) { 
          fileLinks.push(`https://drive.google.com/file/d/${result.id}/preview`);
        }
      } catch (error) {
        throw error;
      }
    };

  const handleFileUpload = async (files: File[]): Promise<string[]> => {
    try {
      let folderId = await searchFolder('Francium');
  
      if (!folderId) {
        folderId = await createFolder('Francium');
      }
  
      const uploadPromises = files.map((file) => uploadFile(file, folderId));
      await Promise.all(uploadPromises);
      return ;
    } catch (error) {
      Cookies.remove('access_token')
      setAccessToken(undefined)
      toast({
        variant: "destructive",
        title: "Unable to upload media",
        description: "Please sign into Google Drive again.",
        duration: 3000
      })
      throw error;
    }
  };

  const handlePost = async () => {
    try {
      setPostDrawerOpen(false);
      
      if (files.length > 0) {
        try {
          await handleFileUpload(files);
        } catch (uploadError) {
          toast({
            variant: "destructive",
            title: "File Upload Failed",
            description: uploadError.message,
            duration: 5000
          });
          Cookies.remove("access_token")
          return;
        }
      }
      
      const postID = ID.unique();

      await databases.createDocument(
        appwriteConfig.databaseID,
        appwriteConfig.postCollectionID,
        postID,
        {
          user_id: user_id,
          type: activeTab,
          files: fileLinks || [],
          caption: caption.trim() || "",
          location: location.trim() || null,
          hashtags: tag ? tag.split(",").map(t => t.trim()).filter(t => t !== "") : [],
          tagged_people: people ? people.split(",").map(p => p.trim()).filter(p => p !== "") : []
        }
      );

      // taggedUserIDs.documents.map(user => user.$id) : [],
      
      const userData = await databases.getDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id
      );

      // Update document with new post at the beginning of posts array
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id,
        {
          posts: [postID, ...(userData.posts || [])]
        }
      );

      // Send notification
      try{
        fetch('https://francium-notification.onrender.com/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            userID: user_id,
          })
        });
      } catch (error) {}

      if (people) {
        const taggedUsernames = people.split(",").map(p => p.trim()).filter(p => p !== "");
        
        for (const username of taggedUsernames) {
          try {
            // Query to find user by username
            const taggedUserDocs = await databases.listDocuments(
              appwriteConfig.databaseID,
              appwriteConfig.userCollectionID,
              [
                Query.equal("username", username)
              ]
            );
  
            if (taggedUserDocs.documents.length > 0) {
              const taggedUser = taggedUserDocs.documents[0];
              // Update tagged_posts array for the user
              await databases.updateDocument(
                appwriteConfig.databaseID,
                appwriteConfig.userCollectionID,
                taggedUser.$id,
                {
                  tagged_posts: [postID, ...(taggedUser.tagged_posts || [])]
                }
              );

              // Send post request to notification server
              try {
                fetch('https://francium-notification.onrender.com/tag', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    username: username,
                    userID: taggedUser.$id,
                    userID0: user_id
                  })
                });
              } catch (error) {}

              const notificationID2 = ID.unique();
              await databases.createDocument(
                appwriteConfig.databaseID,
                appwriteConfig.notificationCollectionID,
                notificationID2,
                {
                  user_id: user_id,
                  description: username + " tagged you in their new post.",
                  action_id: postID,
                  type: "tag",
                }
              );

              // Update user document with new notification
              const currentNotifications = taggedUser.notifications || [];
              await databases.updateDocument(
                appwriteConfig.databaseID,
                appwriteConfig.userCollectionID,
                taggedUser.$id,
                {
                  notifications: [notificationID2, ...currentNotifications]
                }
              );
            }
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Failed to tag user",
              description: "Something went wrong.",
              duration: 3000
            })
          }
        }
      }

      // Clear states
      setFiles([])
      fileLinks = []
      setCaption("")
      setLocation("")
      setPeople("")
      setTag("")

      toast({
        title: "Post created",
        description: "Your post has been successfully created and shared.",
        duration: 3000
      })

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating post",
        description: "Something went wrong. Please try again later.",
        duration: 3000
      })
    }
  }

  const handleCaption = (e) => {
    setCaption(e.target.value);
  }

  const handleLocation = (e) => {
    setLocation(e.target.value);
  }

  const handleTag = (e) => {
    setTag(e.target.value);
  }

  const handlePeople = (e) => {
    setPeople(e.target.value);
  }

  return (
    <div>
    <Drawer open={isPostDrawerOpen} onOpenChange={setPostDrawerOpen}>
      <DrawerTrigger asChild>
      <div>
        {/* First Button: Visible on large (`lg`) and extra-large (`xl`) screens */}
        <Button className="mt-4 w-full hidden lg:flex xl:flex items-center justify-center" disabled={!user_id}>
          <SquarePen className="mr-2 h-4 w-4" />
          <span className="inline">Post</span>
        </Button>

        {/* Second Button: Visible on medium (`md`) screens but hidden on large (`lg`) and extra-large (`xl`) screens */}
        <Button className="flex md:flex lg:hidden xl:hidden items-center justify-center" size="icon" disabled={!user_id}>
          <SquarePen className="h-4 w-4" />
        </Button>
      </div>
      </DrawerTrigger>
      <DrawerContent className='bg-background'>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className='flex justify-between items-center'>
            <div className='text-left w-full md:w-auto'>
              <DrawerTitle>Create New</DrawerTitle>
              <DrawerDescription>Share your thoughts.</DrawerDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Post Guidelines</DialogTitle>
                  <DialogDescription className="whitespace-pre-line">
                  {'\n'}Post: Best for content writing and general purpose.{'\n'}
                    Carousel: Best for your favorite photos.{'\n'}
                    Reel: Best for videos.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <Tabs defaultValue="post" className="w-full" onValueChange={(value) => setActiveTab(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="post" className='gap-2'>
                    <GalleryVertical className='h-4 w-4'></GalleryVertical>
                    <span className='hidden md:block'>Post</span>
                  </TabsTrigger>
                  <TabsTrigger value="carousel" className='gap-2'>
                    <Image className='h-4 w-4'></Image>
                    <span className='hidden md:block'>Carousel</span>
                  </TabsTrigger>
                  <TabsTrigger value="reel" className='gap-2'>
                    <Clapperboard className='h-4 w-4'></Clapperboard>
                    <span className='hidden md:block'>Reel</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="post">
                  <div className="flex items-start justify-between mt-4 mb-2">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={profile} alt="Fr" className='object-cover object-center'/>
                        <AvatarFallback>Fr</AvatarFallback>
                      </Avatar> 
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium">{user_id ? name : "Guest User"}</p>
                          {user_id && verified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user_id ? username : "guest"}</p>
                      </div>
                    </div>
                  </div>
                  <Label htmlFor="caption" className="text-sm font-medium">
                    Caption
                  </Label>
                  <Textarea rows={8} placeholder="What's new?" className='mt-2 mb-2 text-md' onChange={handleCaption}/>
                  <div className='space-y-2'>
                    <Label htmlFor="photo" className="text-sm font-medium">
                      File
                    </Label>
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
                      <Input id="photo" type="file" multiple accept="image/*, video/*" onChange={(e) => setFiles(Array.from(e.target.files))}/>
                    )}
                    <ToggleGroup className='mt-2' type="single">
                      <ToggleGroupItem value="location">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Location</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Location</DialogTitle>
                              <DialogDescription>
                                Enter location you took the photos. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Add location" className="text-md" onChange={handleLocation} />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button">
                                  Save
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="tag">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Hashtag</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Hashtag</DialogTitle>
                              <DialogDescription>
                                Enter hashtags here. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 mt-1">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Add tags" className="text-md" onChange={handleTag} />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button">
                                  Save
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="people">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Tag People</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Tag people</DialogTitle>
                              <DialogDescription>
                                Tag people in your content. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 mt-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Add tagged people" className="text-md" onChange={handlePeople} />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button">
                                  Save
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </TabsContent>
                <TabsContent value="carousel">
                  <div className="flex items-start justify-between mt-4 mb-2">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={profile} alt="Fr" className='object-cover object-center' />
                        <AvatarFallback>Fr</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium">{user_id ? name : "Guest User"}</p>
                          {user_id && verified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user_id ? username : "guest"}</p>
                      </div>
                    </div>
                  </div>
                  <Label htmlFor="caption" className="text-sm font-medium">
                    Caption
                  </Label>
                  <Textarea rows={4} placeholder="What's new?" className='mt-2 mb-2 text-md' onChange={handleCaption}/>
                  <div className='space-y-2'>
                    <Label htmlFor="photo" className="text-sm font-medium">
                      Photos (or) Videos
                    </Label>
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
                      <Input id="photo" type="file" multiple accept="image/*, video/*" onChange={(e) => setFiles(Array.from(e.target.files))}/>
                    )}
                    <ToggleGroup type="single">
                      <ToggleGroupItem value="location">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Location</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Location</DialogTitle>
                              <DialogDescription>
                                Enter location you took the photos. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <Input id="location" placeholder="Add location" className="text-md" onChange={handleLocation} />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button">
                                  Save
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="tag">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Hashtag</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Hashtag</DialogTitle>
                              <DialogDescription>
                                Enter hashtags here. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 mt-1">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Add tags" className="text-md" onChange={handleTag} />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button">
                                  Save
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="people">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Tag People</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Tag people</DialogTitle>
                              <DialogDescription>
                                Tag people in your photos and videos. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 mt-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Add tagged people" className="text-md" onChange={handlePeople} />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button">
                                  Save
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </TabsContent>
                <TabsContent value="reel">
                  <div className="flex items-start justify-between mt-4 mb-2">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={profile} alt="Fr" className='object-cover object-center' />
                        <AvatarFallback>Fr</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium">{user_id ? name : "Guest User"}</p>
                          {user_id && verified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user_id ? username : "guest"}</p>
                      </div>
                    </div>
                  </div>
                  <Label htmlFor="caption" className="text-sm font-medium">
                    Caption
                  </Label>
                  <Textarea rows={4} placeholder="What's new?" className='mt-2 mb-2 text-md' onChange={handleCaption} />
                  <div className='space-y-2'>
                    <Label htmlFor="photo" className="text-sm font-medium">
                      Video
                    </Label>
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
                      <Input id="photo" type="file" accept="video/*" onChange={(e) => setFiles(Array.from(e.target.files))}/>
                    )}
                    <ToggleGroup type="single">
                      <ToggleGroupItem value="location">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Location</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Location</DialogTitle>
                              <DialogDescription>
                                Enter location you took the photos. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <Input id="location" placeholder="Add location" className="text-md" onChange={handleLocation} />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button">
                                  Save
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="tag">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Hashtag</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Hashtag</DialogTitle>
                              <DialogDescription>
                                Enter hashtags here. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 mt-1">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Add tags" className="text-md" onChange={handleTag} />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button">
                                  Save
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ToggleGroupItem>
                      <ToggleGroupItem value="people">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Tag People</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Tag people</DialogTitle>
                              <DialogDescription>
                                Tag people in your reel. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center space-x-2 mt-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Add tagged people" className='text-md' onChange={handlePeople} />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button">
                                  Save
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handlePost}>Post</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
    </div>
    
  )
}