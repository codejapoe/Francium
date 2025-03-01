import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { Query } from "appwrite";
import Header from '../components/header';
import SideNav from '../components/side-nav';
import Trendings from '../components/trendings';
import Post from '../components/post';
import FollowSuggestions from '../components/follow-suggestions';
import BottomNav from '../components/bottom-nav';
import { Loader2 } from 'lucide-react';
import RootLayout from "./layout";
import { generateToken, messaging } from "@/notifications/firebase"
import { onMessage } from "firebase/messaging";
import { useToast } from "@/components/ui/use-toast.js";
import { fetchUserDetails } from "@/lib/functions/user-functions.js";
import { Skeleton } from '@/components/ui/skeleton';
import { Bug } from 'lucide-react';
import { getCurrentUser } from "@/lib/appwrite/api.js";

export default function Home() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user_id, setUserID] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("");
  const [verified, setVerified] = useState(false);
  const [followings, setFollowings] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);

  useEffect(() => {
    verifyUser();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsPostsLoading(true);
        await fetchPosts();
      } catch (error) {
      } finally {
        setIsPostsLoading(false);
      }
    };
  
    loadPosts();

    const intervalId = setInterval(async () => {
      await fetchPosts();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [followings]);

  const verifyUser = async () => {
    const response = await getCurrentUser()
    if (response.$id) {
      setUserID(response.$id);
      setUsername(response.username);
      setName(response.name);
      setProfile(response.profile);
      setVerified(response.verified);
      setFollowings(response.followings);

      try {
        await generateToken(user_id);
        onMessage(messaging, (payload) => {
          toast({
            title: payload.notification.title,
            description: payload.notification.body,
            duration: 3000,
          });
        });
      } catch (error) {
      }
    } else {
      navigate('/explore')
    }
  };

  const fetchPosts = async () => {
    try {
      const allPosts = [];

      if (!followings || followings.length === 0) {
        setPosts([]);
        return;
      }

      // Use Promise.all to handle all followings in parallel
      await Promise.all(followings.map(async (uid) => {
        try {
          const user = await databases.getDocument(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            uid
          );

          // Ensure arrays exist, if not use empty arrays
          const userPosts = Array.isArray(user.posts) ? user.posts : [];
          const userReposts = Array.isArray(user.reposts) ? user.reposts : [];
          const userTaggedPosts = Array.isArray(user.tagged_posts) ? user.tagged_posts : [];

          if (userPosts.length === 0 && userReposts.length === 0 && userTaggedPosts.length === 0) {
            return;
          }

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
        <Header activeTab="followings" username={username} name={name} profile={profile} verified={verified}/>
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
            posts.map((post, index) => (
                <Post 
                  key={index} 
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