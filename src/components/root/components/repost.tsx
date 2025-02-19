import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import { Heart, MessageCircle, Repeat2, Bookmark, BadgeCheck, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'

interface RepostCardProps {
  reposter: {
    name: string
    username: string
    avatar: string
  }
  originalPost: {
    name: string
    username: string
    avatar: string
    content: string
    timestamp: string
    isVerified?: boolean
  }
}

export default function RepostCard({ reposter, originalPost }: RepostCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pt-4 px-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Repeat2 className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{reposter.name} reposted.</p>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar>
              <AvatarImage src={originalPost.avatar} alt={originalPost.name} className='object-cover object-center' />
              <AvatarFallback>{originalPost.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <p className="font-medium">{originalPost.name}</p>
                {originalPost.isVerified && <TooltipProvider><Tooltip><TooltipTrigger><BadgeCheck className="h-4 w-4 text-blue-500 ml-1" /></TooltipTrigger><TooltipContent>Verified</TooltipContent></Tooltip></TooltipProvider>}
              </div>
              <p className="text-sm text-muted-foreground">@<Link to={originalPost.username}>{originalPost.username}</Link> · {originalPost.timestamp}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuItem>Translate</DropdownMenuItem>
              <DropdownMenuItem>Show info</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Report post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p>{originalPost.content}</p>
      </CardContent>
      <CardFooter className='pb-4'>
        <div className="flex justify-between w-full">
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="sm" className="px-2">
                    <Heart className="h-4 w-4 mr-1" />
                    103
                  </Button>
              </TooltipTrigger>
                <TooltipContent>
                  <p>Like</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="sm" className="px-2">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    24
                  </Button>
              </TooltipTrigger>
                <TooltipContent>
                  <p>Comment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="sm" className="px-2">
                    <Repeat2 className="h-4 w-4 mr-1" />
                    5
                  </Button>
              </TooltipTrigger>
                <TooltipContent>
                  <p>Repost</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="icon">
                    <Bookmark className="h-4 w-4" />
                  </Button>
              </TooltipTrigger>
                <TooltipContent>
                  <p>Bookmark</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}