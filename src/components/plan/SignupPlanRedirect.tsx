'use client'

/**
 * Après la première connexion : si la version Pro (ou un code) a été choisie à l'inscription,
 * on emmène une fois le membre sur « Offres et abonnements » pour la finaliser.
 */
import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { usePlan } from '@/lib/plan'

export default function SignupPlanRedirect() {
  const { plan } = usePlan()
  const router = useRouter()
  const pathname = usePathname()
  const done = useRef(false)

  useEffect(() => {
    if (done.current || !plan?.signupPlan || plan.isPro) return
    if (pathname === '/subscriptions') { done.current = true; return }
    let seen = false
    try { seen = sessionStorage.getItem('lsb-signup-plan-shown') === '1' } catch { }
    if (seen) return
    done.current = true
    try { sessionStorage.setItem('lsb-signup-plan-shown', '1') } catch { }
    router.push('/subscriptions')
  }, [plan, pathname, router])

  return null
}
