import { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { Query } from "appwrite";
import bcrypt from "bcryptjs";
import { decryptPassword } from "@/lib/functions/password-manager";
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import Header from '../components/header';
import BottomNav from '../components/bottom-nav'
import Post from '../components/post'
import FollowSuggestions from '../components/follow-suggestions'
import { Loader2, RotateCw } from 'lucide-react'
import 'react-photo-view/dist/react-photo-view.css';
import RootLayout from "./layout";
import SideNav from '../components/side-nav';
import Trendings from '../components/trendings';
import { messaging } from "../../../notifications/firebase.js"
import { onMessage } from "firebase/messaging";
import { fetchUserDetails } from "@/lib/functions/user-functions.js";
import { getCurrentUser } from "@/lib/appwrite/api.js";

export default function PostViewer() {
const navigate = useNavigate();
  const { toast } = useToast()
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(undefined);
  const [isPostLoading, setIsPostLoading] = useState(undefined);
  const [user_id, setUserID] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [verified, setVerified] = useState(false);
  const [post, setPost] = useState<Post | Record<string, never>>({});
  interface Post {
    $id: string;
    $createdAt: string;
    user_id: string;
    user_data?: {
      name: string;
      username: string;
      profile: string;
      verified: boolean;
    };
    caption: string;
    type: string;
    files: string[];
    location: string;
    hashtags: string[];
    tagged_people: string[];
    likes: string[];
    comments: string[];
    reposts: string[];
  }
  interface PostProps {
    currentUserID: string;
    currentUsername: string;
    id: string;
    user_id: string;
    name: string;
    username: string;
    profile: string;
    isVerified: boolean;
    timestamp: string;
    caption: string;
    type: string;
    files: string[];
    location: string;
    hashtags: string[];
    tagged_people: string[];
    likes: string[];
    comments: string[];
    reposts: string[];
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setIsPostLoading(true);
        await verifyUser();
        await fetchData();
      } catch (error) {
      } finally {
        setIsPostLoading(false);
        setIsLoading(false);
      }
    };

    loadData();

    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [id]);

  const fetchData = async() => {
    try {
        const response = await databases.getDocument(
          appwriteConfig.databaseID,
          appwriteConfig.postCollectionID,
          id
        );
        
        // Get user details for the post
        const [userDetails] = await fetchUserDetails([response.user_id]);
        const postData: Post = {
            $id: response.$id,
            $createdAt: response.$createdAt,
            user_id: response.user_id,
            user_data: {
                name: userDetails.name || "",
                username: userDetails.username || "",
                profile: userDetails.profile || "",
                verified: userDetails.verified || false
            },
            caption: response.caption || "",
            type: response.type || "text",
            files: response.files || [],
            location: response.location || "",
            hashtags: response.hashtags || [],
            tagged_people: response.tagged_people || [],
            likes: response.likes || [],
            comments: response.comments || [],
            reposts: response.reposts || []
        };
          
          setPost(postData);
    } catch (error) {
        navigate('/404');
    }
  }

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

  const refreshPosts = () => {
    fetchData();
    toast({
      title: "Post refreshed",
      description: "Check for new updates.",
      duration: 3000
    })
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
      <div className="min-h-screen bg-background">
        <Header activeTab="#" username={username} name={name} profile={profile} verified={verified}/>

          <div className="container mx-auto px-4 py-2 flex gap-8">
              <aside className="hidden lg:block w-1/4 sticky top-20 mt-4 mb-4 self-start">
                <SideNav user_id={user_id} username={username} name={name} profile={profile} verified={verified}/>
              </aside>
              <main className="w-full lg:w-1/2 pb-16 lg:pb-0">
                <div className="flex justify-between items-center pb-2">
                    <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                        <BreadcrumbLink href="/" className="text-foreground">Home</BreadcrumbLink>
                        </BreadcrumbItem><BreadcrumbSeparator />
                        <BreadcrumbItem>
                        <BreadcrumbPage>Post</BreadcrumbPage>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                        <BreadcrumbPage>{id}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                    </Breadcrumb>
                    <Button size="icon" variant="outline" onClick={() => refreshPosts()}>
                    <RotateCw className="w-4 h-4" />
                    </Button>
                </div>
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
                ) : post && Object.keys(post).length > 0 ? (
                    <Post
                        key={post.$id}
                        {...{
                            key: post.$id,
                            currentUserID: user_id,
                            currentUsername: username,
                            id: post.$id,
                            user_id: post.user_id,
                            name: post.user_data?.name || "",
                            username: post.user_data?.username || "",
                            profile: post.user_data?.profile || "",
                            isVerified: post.user_data?.verified || false,
                            timestamp: post.$createdAt,
                            caption: post.caption || "",
                            type: post.type || "text",
                            files: post.files || [],
                            location: post.location || "",
                            hashtags: post.hashtags || [],
                            tagged_people: post.tagged_people || [],
                            likes: post.likes || [],
                            comments: post.comments || [],
                            reposts: post.reposts || []
                        } as PostProps}
                    />
                ) : (
                    null
                )}
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
  )
}