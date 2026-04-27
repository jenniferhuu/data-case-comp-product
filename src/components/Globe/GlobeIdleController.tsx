'use client'

import { useEffect } from 'react'
import { useDashboardState } from '../../features/dashboard/useDashboardState'

export function GlobeIdleController() {
  const idleMode = useDashboardState((state) => state.idleMode)

  useEffect(() => {
    if (!idleMode) {
      return
    }

    // Preserve the composition boundary while idle camera behavior is added later.
  }, [idleMode])

  return null
}
