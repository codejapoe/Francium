import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const items = [
  {
    id: 'home',
    label: 'Home',
		disabled: true
  },
  {
    id: 'explore',
    label: 'Explore',
		disabled: true
  },
  {
    id: 'notifications',
    label: 'Notifications',
		disabled: true
  },
  {
    id: 'profile',
    label: 'Profile',
		disabled: true
  },
  {
    id: 'bookmarks',
    label: 'Bookmarks',
		disabled: false
  },
	{
    id: 'settings',
    label: 'Settings',
		disabled: false
  },
] as const

const displayFormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one item.',
  }),
})

type DisplayFormValues = z.infer<typeof displayFormSchema>

// This can come from your database or API.
const defaultValues: Partial<DisplayFormValues> = {
  items: ['home', 'explore', 'notifications', 'profile', ...(localStorage.getItem('bookmarks') === "true" ? [] : ['bookmarks']),
	...(localStorage.getItem('settings') === "true" ? [] : ['settings'])],
}

export default function DisplayForm() {
	const { toast } = useToast();
  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues,
  })

  function onSubmit(data: DisplayFormValues) {
		if (data.items.includes('bookmarks')) {
			localStorage.removeItem('bookmarks')
		} else {
			localStorage.setItem('bookmarks', "true");
		}

		if (data.items.includes('settings')) {
			localStorage.removeItem('settings')
		} else {
			localStorage.setItem('settings', "true");
		}

    toast({
      title: 'Success',
      description: 'Displayed updated successfully.'
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='items'
          render={() => (
            <FormItem>
              <div className='mb-4'>
                <FormLabel className='text-base'>Desktop Sidebar</FormLabel>
                <FormDescription>
                  Select the items you want to display in the sidebar.
                </FormDescription>
              </div>
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name='items'
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className='flex flex-row items-start space-x-3 space-y-0'
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.id
                                    )
                                  )
                            }}
														disabled={item.disabled}
                          />
                        </FormControl>
                        <FormLabel className='font-normal'>
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit'>Update display</Button>
      </form>
    </Form>
  )
}