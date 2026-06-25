'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Cette page redirige vers la messagerie split-screen principale.
 * Les liens vers /messages/[id] (ex: depuis les profils) continuent de fonctionner.
 */
export default function ConversationRedirect() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  useEffect(() => {
    if (params?.id) {
      router.replace(`/messages?c=${params.id}`)
    } else {
      router.replace('/messages')
    }
  }, [params?.id, router])

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
      <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
    </div>
  )
}
