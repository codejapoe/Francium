import ContentSection from '../components/content-section'
import AccountForm from './account-form'

export default function SettingsAccount() {
  return (
    <ContentSection
      title='Account'
      desc='Update your account settings. Change your password or Sign out.'
    >
      <AccountForm />
    </ContentSection>
  )
}