import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom';

export default function Trendings() {
  const navigate = useNavigate();
  const hashtags = ['Francium', 'Codejapoe', 'Coinleft'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Trendings</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {hashtags.map((hashtag) => (
              <li key={hashtag}>
                <Button variant="link" className="p-0 h-auto font-normal text-base" onClick={() => navigate(`/hashtag/${hashtag}`)}>
                  # {hashtag}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}