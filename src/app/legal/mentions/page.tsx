import type { Metadata } from 'next'
import LegalPage from '@/components/legal/LegalPage'
import LegalMarkdown from '@/components/legal/LegalMarkdown'
import { MENTIONS } from '@/content/legal'

export const metadata: Metadata = { title: 'Mentions légales' }

export default function MentionsPage() {
  return (
    <LegalPage title="Mentions légales">
      <LegalMarkdown source={MENTIONS} />
    </LegalPage>
  )
}
