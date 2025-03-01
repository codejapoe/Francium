import ContentSection from '../components/content-section'
import AccountForm from './account-form'

interface SettingsAccountProps {
  user_id: string;
}

export default function SettingsAccount({user_id}: SettingsAccountProps) {
  return (
    <ContentSection
      title='Account'
      desc='Update your account settings. Change your password or Sign out.'
    >
      <AccountForm user_id={user_id} />
    </ContentSection>
  )
}