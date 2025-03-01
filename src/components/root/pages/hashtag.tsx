import { useEffect, useState } from "react";
import { useParams, Link } from 'react-router-dom';
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { Query } from "appwrite";
import Header from '../components/header';
import SideNav from '../components/side-nav';
import Trendings from '../components/trendings';
import { Skeleton } from "@/components/ui/skeleton"
import FollowSuggestions from '../components/follow-suggestions';
import BottomNav from '../components/bottom-nav';
import { Loader2, Bug, Clapperboard, Image, GalleryVertical } from 'lucide-react';
import RootLayout from "./layout";
import { messaging } from "../../../notifications/firebase.js"
import { onMessage } from "firebase/messaging";
import { useToast } from "@/components/ui/use-toast.js";
import Post from '../components/post'
import { fetchUserDetails } from "@/lib/functions/user-functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentUser } from "@/lib/appwrite/api.js";

export default function HashTag() {
  const { toast } = useToast();
  const { tag } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isPostLoading, setIsPostLoading] = useState(true);
  const [user_id, setUserID] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [verified, setVerified] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postUserDetails, setPostUserDetails] = useState([]);
  const [lastPostId, setLastPostId] = useState(null);
  
  useEffect(() => {
    const verifyUser = async () => {
      setIsLoading(true);
      
      const response = await getCurrentUser();
      if (response.$id) {
        setUserID(response.$id);
        setUsername(response.username);
        setName(response.name);
        setProfile(response.profile);
        setVerified(response.verified);

        onMessage(messaging, (payload) => {
          toast({
            title: payload.notification.title,
            description: payload.notification.body,
            duration: 3000,
          });
        });
      }

      setIsLoading(false);
    };

    verifyUser();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsPostLoading(true);
      await fetchData();
      setIsPostLoading(false);
    }
    loadData();

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async(isUpdate = false) => {
    try {
      const queries = [
        Query.search('hashtags', tag),
        Query.orderDesc('$createdAt'),
        Query.limit(25)
      ];
      
      if (isUpdate && lastPostId) {
        queries.push(Query.cursorAfter(lastPostId));
      }

      const response = await databases.listDocuments(
        appwriteConfig.databaseID,
        appwriteConfig.postCollectionID,
        queries
      );

      if (response.documents.length > 0) {
        // Fetch user details for each post
        const userDetailsPromises = response.documents.map(async (post) => {
          const userDetails = await fetchUserDetails([post.user_id]);
          return userDetails[0];
        });
        
        const userDetails = await Promise.all(userDetailsPromises);
        const userDetailsMap = {};
        response.documents.forEach((post, index) => {
          userDetailsMap[post.$id] = userDetails[index];
        });
        
        setPostUserDetails(prevDetails => ({
          ...prevDetails,
          ...userDetailsMap
        }));

        if (isUpdate) {
          // Filter out duplicates based on post ID
          setPosts(prevPosts => {
            const existingIds = new Set(prevPosts.map(post => post.$id));
            const newPosts = response.documents.filter(post => !existingIds.has(post.$id));
            return [...newPosts, ...prevPosts];
          });
        } else {
          setPosts(response.documents);
        }
        
        if (response.documents.length > 0) {
          setLastPostId(response.documents[0].$id);
        }
      }
    } catch (error) {
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col space-y-4 items-center justify-center">
        <Loader2 className="animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <RootLayout>
      <div className="min-h-screen bg-background text-foreground">
        <Header activeTab="#" username={username} name={name} profile={profile} verified={verified}/>
        <div className="container mx-auto px-4 py-4 flex gap-8">
          <aside className="hidden lg:block w-1/4 sticky top-20 self-start">
            <SideNav user_id={user_id} username={username} name={name} profile={profile} verified={verified}/>
          </aside>
          <main className="w-full lg:w-1/2 pb-16 lg:pb-0">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts" className="gap-2"><GalleryVertical className="w-4 h-4" /><span className="hidden md:block">Posts</span></TabsTrigger>
                <TabsTrigger value="carousels" className="gap-2"><Image className="w-4 h-4" /><span className="hidden md:block">Carousels</span></TabsTrigger>
                <TabsTrigger value="reels" className="gap-2"><Clapperboard className="w-4 h-4" /><span className="hidden md:block">Reels</span></TabsTrigger>
              </TabsList>
              <TabsContent value="posts">
                { isPostLoading ? (
                    <div className="space-y-4 mb-4">
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
                                Posts will appear here <br/> when someone posts.
                            </p>
                        </div>
                    </div>
                ) : (
                    posts.map((post, index) => (
                      post.type === "post" &&
                      <Post 
                      key={index} 
                      currentUserID={user_id}
                      currentUsername={username}
                      id={post.$id} 
                      user_id={post.user_id} 
                      name={postUserDetails[post.$id]?.name} 
                      username={postUserDetails[post.$id]?.username} 
                      profile={postUserDetails[post.$id]?.profile} 
                      isVerified={postUserDetails[post.$id]?.verified} 
                      timestamp={post.$createdAt} 
                      caption={post.caption} 
                      type={post.type} 
                      files={post.files} 
                      location={post.location} 
                      hashtags={post.hashtags} 
                      tagged_people={post.tagged_people} 
                      likes={post.likes} 
                      comments={post.comment} 
                      reposts={post.reposts} 
                      {...post} 
                      />
                    ))
                )}
              </TabsContent>
              <TabsContent value="carousels">
                { isPostLoading ? (
                    <div className="space-y-4 mb-4">
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
                                Posts will appear here <br/> when someone posts.
                            </p>
                        </div>
                    </div>
                ) : (
                    posts.map((post, index) => (
                      post.type === "carousel" &&
                      <Post 
                      key={index} 
                      currentUserID={user_id}
                      currentUsername={username}
                      id={post.$id} 
                      user_id={post.user_id} 
                      name={postUserDetails[post.$id]?.name} 
                      username={postUserDetails[post.$id]?.username} 
                      profile={postUserDetails[post.$id]?.profile} 
                      isVerified={postUserDetails[post.$id]?.verified} 
                      timestamp={post.$createdAt} 
                      caption={post.caption} 
                      type={post.type} 
                      files={post.files} 
                      location={post.location} 
                      hashtags={post.hashtags} 
                      tagged_people={post.tagged_people} 
                      likes={post.likes} 
                      comments={post.comment} 
                      reposts={post.reposts} 
                      {...post} 
                      />
                    ))
                )}
              </TabsContent>
              <TabsContent value="reels">
                { isPostLoading ? (
                    <div className="space-y-4 mb-4">
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
                                Posts will appear here <br/> when someone posts.
                            </p>
                        </div>
                    </div>
                ) : (
                    posts.map((post, index) => (
                      post.type === "reel" &&
                      <Post 
                      key={index} 
                      currentUserID={user_id}
                      currentUsername={username}
                      id={post.$id} 
                      user_id={post.user_id} 
                      name={postUserDetails[post.$id]?.name} 
                      username={postUserDetails[post.$id]?.username} 
                      profile={postUserDetails[post.$id]?.profile} 
                      isVerified={postUserDetails[post.$id]?.verified} 
                      timestamp={post.$createdAt} 
                      caption={post.caption} 
                      type={post.type} 
                      files={post.files} 
                      location={post.location} 
                      hashtags={post.hashtags} 
                      tagged_people={post.tagged_people} 
                      likes={post.likes} 
                      comments={post.comment} 
                      reposts={post.reposts} 
                      {...post} 
                      />
                    ))
                )}
              </TabsContent>
            </Tabs>
          </main>
          <aside className="hidden lg:block w-1/4 sticky top-20 self-start">
            <div className="space-y-6">
              <Trendings />
              <FollowSuggestions />
              <p className='pl-4 text-sm text-muted-foreground'>2025 Francium © Codejapoe <br/><a href="https://www.codejapoe.xyz" target='_blank'>www.codejapoe.xyz</a></p>
            </div>
          </aside>
        </div>
        <BottomNav user_id={user_id} username={username} name={name} profile={profile} verified={verified}/>
      </div>
    </RootLayout>
  );
}