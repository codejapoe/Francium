import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { Query } from "appwrite";
import bcrypt from "bcryptjs";
import { decryptPassword } from "@/lib/functions/password-manager";
import Header from '../components/header';
import SideNav from '../components/side-nav';
import Sidebar from '../components/trendings';
import Post from '../components/post';
import FollowSuggestions from '../components/follow-suggestions';
import BottomNav from '../components/bottom-nav';
import { Loader2 } from 'lucide-react';
import RootLayout from "./layout";
import { messaging } from "../../../notifications/firebase.js"
import { onMessage } from "firebase/messaging";
import { useToast } from "@/components/ui/use-toast.js";
import { fetchUserDetails } from "@/lib/functions/user-functions.js";
import { Skeleton } from '@/components/ui/skeleton';
import { Bug } from 'lucide-react';
import { getCurrentUser } from "@/lib/appwrite/api.js";

export default function Favorite() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user_id, setUserID] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [verified, setVerified] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    verifyUser();
    setIsLoading(false);

    const loadPosts = async () => {
      try {
        setIsPostsLoading(true);
        await fetchPosts();
      } catch (error) {
      } finally {
        setIsPostsLoading(false);
      }
    };
  
    if (favorites.length > 0) {
      loadPosts();
    }

    const intervalId = setInterval(async () => {
      await fetchPosts();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [favorites]);

  const verifyUser = async () => {
    setIsLoading(true);
    
    const response = await getCurrentUser()
    if (response.$id) {
      setUserID(response.$id);
      setUsername(response.username);
      setName(response.name);
      setProfile(response.profile);
      setVerified(response.verified);
      setFavorites(response.followings);

      onMessage(messaging, (payload) => {
        toast({
          title: payload.notification.title,
          description: payload.notification.body,
          duration: 3000,
        });
      });
      setIsLoading(false);
    } else {
      navigate("/sign-in");
    }
  };

  const fetchPosts = async () => {
    try {
      const allPosts = [];

      // Use Promise.all to handle all followings in parallel
      await Promise.all(favorites.map(async (uid) => {
        try {
          const user = await databases.getDocument(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            uid
          );

          // Ensure arrays exist, if not use empty arrays
          const userPosts = user.posts || [];
          const userReposts = user.reposts || [];
          const userTaggedPosts = user.tagged_posts || [];

          // Fetch posts
          const [postsResponse, repostsResponse, tagsResponse] = await Promise.all([
            // Fetch posts
            userPosts.length > 0 ? databases.listDocuments(
              appwriteConfig.databaseID,
              appwriteConfig.postCollectionID,
              [Query.equal('$id', userPosts)]
            ) : { documents: [] },
            // Fetch reposts
            userReposts.length > 0 ? databases.listDocuments(
              appwriteConfig.databaseID,
              appwriteConfig.postCollectionID,
              [Query.equal('$id', userReposts)]
            ) : { documents: [] },
            // Fetch tagged posts
            userTaggedPosts.length > 0 ? databases.listDocuments(
              appwriteConfig.databaseID,
              appwriteConfig.postCollectionID,
              [Query.equal('$id', userTaggedPosts)]
            ) : { documents: [] }
          ]);

          const userData = {
            name: user.name,
            username: user.username,
            profile: user.profile,
            verified: user.verified
          };

          // Process all posts in parallel
          await Promise.all([
            // Process regular posts
            ...postsResponse.documents.map(post => {
              post.user_data = userData;
              allPosts.push({ ...post });
            }),
            // Process reposts
            ...repostsResponse.documents.map(async (post) => {
              const [userDetails] = await fetchUserDetails([post.user_id]);
              post.user_data = userDetails;
              post.repost_user_data = userData;
              allPosts.push({ ...post });
            }),
            // Process tagged posts
            ...tagsResponse.documents.map(async (post) => {
              const [userDetails] = await fetchUserDetails([post.user_id]);
              post.user_data = userDetails;
              post.tagged_user_data = userData;
              allPosts.push({ ...post });
            })
          ]);
        } catch (error) {
            toast({
              variant: "destructive",
              title: "Error fetching posts",
              description: "An error occurred while fetching posts.",
            });
        }
      }));
      
      // Sort posts by date (newest to oldest)
      allPosts.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
      setPosts(allPosts);
    } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching posts",
          description: "An error occurred while fetching posts.",
        });
      setPosts([]);
    }
  };

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
        <Header activeTab="favorites" username={username} name={name} profile={profile} verified={verified}/>
        <div className="container mx-auto px-4 py-8 flex gap-8">
          <aside className="hidden lg:block w-1/4 sticky top-20 self-start">
            <SideNav user_id={user_id} username={username} name={name} profile={profile} verified={verified}/>
          </aside>
          <main className="w-full lg:w-1/2 pb-16 lg:pb-0">
          { isPostsLoading ? (
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
        ) : favorites.length === 0 ? (
          <div className='mt-12'>
              <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
                  <Bug className="w-24 h-24"/><br />
                  <h1 className='text-4xl font-bold leading-tight'>No favorites yet 🌟</h1>
                  <p className='text-center text-muted-foreground mb-6'>
                      Posts will appear here <br/> when you add users to your favorites.
                  </p>
              </div>
          </div>
        ) : posts.length === 0 ? (
          <div className='mt-12'>
              <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
                  <Bug className="w-24 h-24"/><br />
                  <h1 className='text-4xl font-bold leading-tight'>Nothing to see 👀</h1>
                  <p className='text-center text-muted-foreground mb-6'>
                      Posts will appear here <br/> when you follow an active user or someone posts.
                  </p>
              </div>
          </div>
        ) : (
            posts.map(post => (
                <Post 
                  key={post.$id} 
                  currentUserID={user_id}
                  currentUsername={username}
                  id={post.$id} 
                  user_id={post.user_id} 
                  name={post.user_data?.name}
                  username={post.user_data?.username}
                  profile={post.user_data?.profile}
                  isVerified={post.user_data?.verified}
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
                  repost_user_data={post.repost_user_data}
                  tagged_user_data={post.tagged_user_data}
                />
              ))
            )}
          </main>
          <aside className="hidden lg:block w-1/4 sticky top-20 self-start">
            <div className="space-y-6">
              <Sidebar />
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