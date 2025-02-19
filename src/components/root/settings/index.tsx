import { Separator } from '@/components/ui/separator'
import Header from '../components/header';
import SidebarNav from './components/sidebar-nav'
import BottomNav from '../components/bottom-nav';
import RootLayout from "../pages/layout";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, useParams } from 'react-router-dom';
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { Query } from 'appwrite';
import { messaging } from "../../../notifications/firebase.js"
import { onMessage } from "firebase/messaging";
import { useToast } from "@/components/ui/use-toast.js";
import bcrypt from "bcryptjs";
import { decryptPassword } from "@/lib/functions/password-manager";
import { Loader2, User, Wrench, Palette, AppWindow } from 'lucide-react'
import SettingsAccount from './account/index.js';
import SettingsAppearance from './appearance/index.js';
import SettingsDisplay from './display/index.js';
import SettingsProfile from './profile/index.js';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user_id, setUserID] = useState(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [profile, setProfile] = useState("");
  const [loading, setLoading] = useState(true);
  const { page } = useParams();
  const sidebarNavItems = [
    {
      title: 'Profile',
      icon: <User size={18} />,
      href: '/settings',
    },
    {
      title: 'Account',
      icon: <Wrench size={18} />,
      href: '/settings/account',
    },
    {
      title: 'Appearance',
      icon: <Palette size={18} />,
      href: '/settings/appearance',
    },
    {
      title: 'Display',
      icon: <AppWindow size={18} />,
      href: '/settings/display',
    },
  ]

  const handleRedirect = () => {
    Cookies.remove('user_id');
    Cookies.remove('email');
    Cookies.remove('password');
    Cookies.remove('access_token');
    navigate("/settings/appearance");
  }

  useEffect(() => {
    setLoading(true);
    verifyUser();
    setLoading(false);
  }, [Cookies]);

  const verifyUser = async () => {
    if (Cookies.get('user_id') == undefined || Cookies.get('email') == undefined || Cookies.get('password') == undefined) {
      handleRedirect();
    } else {
      try {
        const response = await databases.listDocuments(
          appwriteConfig.databaseID,
          appwriteConfig.userCollectionID,
          [
            Query.equal('$id', Cookies.get('user_id'))
          ]
        );

        if (response.documents.length) {
          const password = decryptPassword(Cookies.get('password') || "404");
          bcrypt.compare(password, response.documents[0].password, (err, isMatch) => {
            if (isMatch || password === import.meta.env.VITE_GOOGLE_PASSWORD) {
              setUserID(response.documents[0].$id);
              setUsername(response.documents[0].username);
              setName(response.documents[0].name);
              setEmail(response.documents[0].email);
              setPassword(response.documents[0].password);
              setProfile(response.documents[0].profile);
              setVerified(response.documents[0].verified);

              onMessage(messaging, (payload) => {
                toast({
                  title: "New Notification!",
                  description: payload.notification.body,
                  duration: 3000,
                });
              })
            } else if (err || !isMatch) {
              handleRedirect();
            }
          });
        } else {
          handleRedirect();
        }
      } catch (error) {
        handleRedirect();
      }
    }
  };

  if (loading) {
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
        <div className="container pt-4">
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Settings
          </h1>
          <p className='text-muted-foreground'>
            Manage your account settings and set preferences.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
            { page === "account" && user_id != undefined ? (
              <SettingsAccount user_id={user_id} password={password} />
            ) : page === "appearance" ? (
              <SettingsAppearance />
            ) : page === "display" ? (
              <SettingsDisplay />
            ) : (
              user_id != undefined &&
              <SettingsProfile user_id={user_id} name={name} username={username} email={email} />
            )}
          </main>
        </div>
        </div>
        <BottomNav username={username} name={name} profile={profile} verified={verified}/>
      </div>
    </RootLayout>
  )
}