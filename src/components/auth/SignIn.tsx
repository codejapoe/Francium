import React, { useEffect, useRef } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import * as z from "zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import HeroSection from "./HeroSection";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { SigninVal } from "@/lib/validation";
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { loginUserAccount, GoogleLogin } from "@/lib/appwrite/api";
import Cookies from "js-cookie";
import { Query } from "appwrite";
import bcrypt from "bcryptjs";
import { decryptPassword } from "@/lib/functions/password-manager";
import { Link } from "react-router-dom";

const SignIn = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        let email = Cookies.get('email');
        let password = Cookies.get('password');

        if (email && password) {
          password = decryptPassword(password);

          const response = await databases.listDocuments(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            [ Query.equal('email', email) ]
          );

          if (response.documents.length) {
            bcrypt.compare(decryptPassword(Cookies.get('password')), (await response).documents[0].password, (err, isMatch) => {
              if (isMatch) {
                navigate("/");
              }
            });
          }
        }
      } catch (error) {
      }
    };

    fetchDocuments();
  }, [Cookies, appwriteConfig, navigate]);

  const [isDisabled, setIsDisabled] = React.useState(false);
  const buttonRef = useRef(null);

  const form = useForm<z.infer<typeof SigninVal>>({
    resolver: zodResolver(SigninVal),
    defaultValues: {
      id: "",
      password: "",
    },
  });

  const handleSignIn = async (user: z.infer<typeof SigninVal>) => {
    try {
      setIsDisabled(true);
      buttonRef.current.innerHTML = `Loading...`;
  
      const result = await loginUserAccount(user);
  
      switch (result) {
        case 200:
          navigate("/");
          break;
        case 401:
          setValError("Incorrect password");
          break;
        case 404:
          setValError("Account does not exist");
          break;
        case 500:
        default:
          setValError("An unexpected error occurred");
      }
    } catch (error) {
      setValError(`Error: ${error.message || error}`);
    } finally {
      setIsDisabled(false);
      buttonRef.current.innerHTML = `Sign In`;
    }
  };  

  interface TokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
    expires_in: number;
  }

  const GoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse: TokenResponse) => {
      try {
        const res = await GoogleLogin(tokenResponse);
        if (res === 200) {
          navigate("/");
        } else {
          setValError("Cannot authenticate with Google. Please sign in manually.");
        }
      } catch (error) {
        setValError(`Error: ${error.message}`);
      }
    },
    onError: () => setValError("Google login failed. Please try again."),
  });

  const handleSignUp = () => {
    navigate("/sign-up");
  };

  const [valError, setValError] = React.useState("");

  return (
    <Form {...form}>
      <div className="min-h-screen w-full flex bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-background md:bg-background">
          <div className="md:hidden w-full max-w-md mb-8">
            <HeroSection onlyText className="text-center" />
          </div>
          <div className="w-full max-w-md p-8 space-y-6 bg-background rounded-lg shadow-lg mt-2">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">

              <div className="space-y-2">
                <FormField control={form.control} name="id" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Username (or) Email</FormLabel>
                    <FormControl>
                      <Input type="text" className="text-md" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Password</FormLabel>
                    <FormControl>
                      <Input type="password" className="text-md" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  )}
                />
              </div>

              {(valError) && (
                <Alert variant="destructive">
                  <AlertDescription>{valError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isDisabled} ref={buttonRef}>
                Sign In
              </Button>

              <div className="text-center space-x-1">
                <span className="text-sm text-muted-foreground">
                  Don't have an account?
                </span>
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="text-sm font-medium hover:underline"
                >
                  Sign up
                </button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
              <Button
                variant="outline"
                onClick={() => GoogleAuth()}
                className="w-full"
              >
                <FcGoogle className="h-4 w-4 mr-2" />
                <span>Google</span>
              </Button>
            </GoogleOAuthProvider>

            <p className='px-8 text-center text-sm text-muted-foreground'>
            By signing in, you agree to our{' '}
            <Link
              to='/terms-and-conditions'
              className='underline underline-offset-4 hover:text-primary'
            >
              Terms & Conditions
            </Link>{' '}
            and{' '}
            <Link
              to='/privacy-policy'
              className='underline underline-offset-4 hover:text-primary'
            >
              Privacy Policy
            </Link>
            .
          </p>
          </div>
        </div>
        <div className="flex-1 h-screen hidden md:block">
          <HeroSection />
        </div>
      </div>
    </Form>
  );
};

export default SignIn;