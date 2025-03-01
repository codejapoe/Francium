import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from "@/components/ui/use-toast.js";
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import Cookies from 'js-cookie';
import { Label } from '@/components/ui/label';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Logout } from '@/lib/appwrite/api';

interface SettingsAccountProps {
  user_id: string;
}

const accountFormSchema = z.object({
  newPassword: z
    .string()
    .min(8, {
        message: "New password must be at least 8 characters."
    })
    .max(20, {
        message: "New password must be less than 20 characters."
  }),
})

type accountFormValues = z.infer<typeof accountFormSchema>

export default function AccountForm({user_id}: SettingsAccountProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  /*
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);
  const defaultValues: Partial<accountFormValues> = {
    newPassword: ''
  }
  const form = useForm<accountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  async function onSubmit(data: accountFormValues) {
    try {
        let pwd = '';

        if (data.password === '') {
            pwd = import.meta.env.VITE_GOOGLE_PASSWORD;
        } else {
            pwd = data.password;
        }
        
        bcrypt.compare(pwd, password, async (err, isMatch) => {
            if (isMatch) {
                // Update the password in database
                await databases.updateDocument(
                    appwriteConfig.databaseID,
                    appwriteConfig.userCollectionID,
                    user_id,
                    {
                        password: hashPassword(data.newPassword)
                    }
                );

                // Update cookie with new password
                Cookies.set('password', encryptPassword(data.newPassword));
                
                setIsPasswordIncorrect(false);
                toast({
                    title: "Success",
                    description: "Password updated successfully",
                });
            } else if (err || !isMatch) {
                setIsPasswordIncorrect(true);
                toast({
                    title: "Error",
                    description: "Incorrect password",
                    variant: "destructive",
                });
            }
        });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  }*/

  const handleSignOut = () => {
    Logout();
    navigate("/explore");
  }

  return (
    <div className='mt-8 space-y-4'>
      <Label className='text-md'>Actions</Label><br/>
      <Button variant='destructive' onClick={() => handleSignOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
      </Button>
    </div>
  )
}
    {/*
    <Form {...form}>
      <Label className='text-md'>Change Password</Label>
      <form onSubmit={form.handleSubmit(onSubmit)} className='mt-4 space-y-4'>
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Old Password</FormLabel>
              <FormControl>
                <Input type='password' placeholder='••••••••' {...field} />
              </FormControl>
              {isPasswordIncorrect && (
                <Label className='text-red-500'>Incorrect Password</Label>
                )}
              <FormDescription>
                Leave it as blank if you signed up your account with Google.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type='password' placeholder='••••••••' {...field} />
              </FormControl>
              <FormDescription>
                This will be your new password. Password must be between 8 and 20 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Update password</Button>
      </form>
    </Form>*/}