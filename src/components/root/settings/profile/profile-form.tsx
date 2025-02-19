import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from "@/components/ui/use-toast.js";
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useEffect } from 'react'
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import Cookies from 'js-cookie';
import { Query } from 'appwrite';

interface SettingsProfileProps {
  user_id: string;
  username: string;
  name: string;
  email: string;
}

const profileFormSchema = z.object({
    username: z
      .string()
      .min(2, {
        message: 'Username must be at least 2 characters.',
      })
      .max(20, {
        message: 'Username must not be longer than 20 characters.',
      }),
    fullname: z
        .string()
        .min(2, {
        message: 'Name must be at least 2 characters.',
        })
        .max(60, {
        message: 'Name must not be longer than 60 characters.',
        }),
    email: z
      .string({
        required_error: 'Please select an email to display.',
      })
      .email(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileForm({user_id, username, name, email}: SettingsProfileProps) {
  const { toast } = useToast();
  const defaultValues: Partial<ProfileFormValues> = {
    username: username,
    fullname: name,
    email: email
  }
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    form.reset({
      username: username || '',
      fullname: name || '',
      email: email || ''
    })
  }, [form, username, name, email])

  async function onSubmit(data: ProfileFormValues) {
    try {
      // Check for existing username and email
      const [usernameCheck, emailCheck] = await Promise.all([
        databases.listDocuments(
          appwriteConfig.databaseID,
          appwriteConfig.userCollectionID,
          [Query.equal('username', data.username)]
        ),
        databases.listDocuments(
          appwriteConfig.databaseID,
          appwriteConfig.userCollectionID,
          [Query.equal('email', data.email)]
        )
      ]);

      // If username exists and it's not the current user
      if (usernameCheck.documents.length > 0 && usernameCheck.documents[0].$id !== user_id) {
        toast({
          title: "Error",
          description: "Username already exists",
          variant: "destructive",
        });
        return;
      }

      // If email exists and it's not the current user
      if (emailCheck.documents.length > 0 && emailCheck.documents[0].$id !== user_id) {
        toast({
          title: "Error",
          description: "Email already exists",
          variant: "destructive",
        });
        return;
      }

      // If checks pass, update the document
      await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        user_id,
        {
          username: data.username,
          name: data.fullname,
          email: data.email,
        }
      );

      Cookies.set('email', data.email);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='example' {...field} />
              </FormControl>
              <FormDescription>
                This is your unique identifier. It can be your real name or a
                pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='fullname'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='John Doe' {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='example@gmail.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Update profile</Button>
      </form>
    </Form>
  )
}