import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from "@/components/ui/use-toast.js";
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Logout } from '@/lib/appwrite/api';
import { account } from '@/lib/appwrite/config';

const accountFormSchema = z.object({
    password: z
      .string()
      .max(20, {
        message: 'Old password must not be longer than 20 characters.',
    }),
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

export default function AccountForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);
  const defaultValues: Partial<accountFormValues> = {
    password: '',
    newPassword: ''
  }
  const form = useForm<accountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  async function onSubmit(data: accountFormValues) {
    try {
      await account.updatePassword(
        data.newPassword,
        data.password
      );
      form.reset();
      setIsPasswordIncorrect(false);
      toast({
        title: "Success",
        description: "Password updated successfully.",
        variant: "default",
      });
    } catch (error) {
      setIsPasswordIncorrect(true);
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleSignout = async () => {
    await Logout();
    navigate('/explore');
  }

  return (
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
      <div className='mt-8 space-y-4'>
        <Label className='text-md'>Actions</Label><br/>
        <Button variant='destructive' onClick={() => handleSignout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
        </Button>
      </div>
    </Form>
  )
}