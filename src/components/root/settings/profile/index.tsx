import ContentSection from '../components/content-section'
import ProfileForm from './profile-form'

interface SettingsProfileProps {
  user_id: string;
  username: string;
  name: string;
}

export default function SettingsProfile({user_id, username, name}: SettingsProfileProps) {
  return (
    <ContentSection
      title='Profile'
      desc='This is how others will see you on the site.'
    >
      <ProfileForm user_id={user_id} name={name} username={username} />
    </ContentSection>
  )
}