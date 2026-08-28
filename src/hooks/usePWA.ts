'use client'

import { useEffect, useState } from 'react'

export type DeviceType = 'phone' | 'tablet' | 'desktop'

interface PWAState {
  isStandalone: boolean   // installée comme app
  deviceType: DeviceType  // phone / tablet / desktop
  isReady: boolean        // hydration terminée
}

export function usePWA(): PWAState {
  const [state, setState] = useState<PWAState>({
    isStandalone: false,
    deviceType: 'desktop',
    isReady: false,
  })

  useEffect(() => {
    const getDeviceType = (): DeviceType => {
      const w = window.innerWidth
      if (w < 768) return 'phone'
      if (w < 1024) return 'tablet'
      return 'desktop'
    }

    const update = () => {
      setState({
        isStandalone:
          window.matchMedia('(display-mode: standalone)').matches ||
          ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true),
        deviceType: getDeviceType(),
        isReady: true,
      })
    }

    update()

    const mq = window.matchMedia('(display-mode: standalone)')
    mq.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return state
}
