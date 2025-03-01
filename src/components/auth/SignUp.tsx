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
import { SignupVal } from "@/lib/validation";
import { createUserAccount } from "@/lib/appwrite/api";
import { Link } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();

  const [isDisabled, setIsDisabled] = React.useState(false);
  const buttonRef = useRef(null);

  const form = useForm<z.infer<typeof SignupVal>>({
    resolver: zodResolver(SignupVal),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  const handleSignUp = async (user: z.infer<typeof SignupVal>) => {
    try {
      setIsDisabled(true);
      buttonRef.current.innerHTML = `Loading...`;
  
      const result = await createUserAccount(user);
  
      switch (result) {
        case 200:
          navigate("/");
          break;
        case 409:
          setValError("Account with that email already exists, please sign in");
          break;
        case 422:
          setValError("Username already exists");
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
  
  const handleSignIn = () => {
    navigate("/sign-in");
  };

  const [valError, setValError] = React.useState("");

  return (
    <Form {...form}>
      <div className="min-h-screen w-full flex bg-gray-50">
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-background">
          <div className="md:hidden w-full max-w-md mb-8">
            <HeroSection onlyText className="text-center" />
          </div>
          <div className="w-full max-w-md p-8 space-y-6 bg-background rounded-lg shadow-lg mt-2">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground">
                Enter your details to get started
              </p>
            </div>

            <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
              <div className="space-y-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Full Name</FormLabel>
                    <FormControl>
                      <Input type="text" className="text-md" placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Username</FormLabel>
                    <FormControl>
                      <Input type="text" className="text-md" placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="shad-form_label">Email</FormLabel>
                    <FormControl>
                      <Input type="email" className="text-md" placeholder="name@example.com" {...field} />
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
                Sign Up
              </Button>

              <div className="text-center space-x-1">
                <span className="text-sm text-muted-foreground">
                  Already have an account?
                </span>
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="text-sm font-medium hover:underline"
                >
                  Sign in
                </button>
              </div>
            </form>

            <p className='px-8 text-center text-sm text-muted-foreground'>
            By signing up, you agree to our{' '}
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

export default SignUp;