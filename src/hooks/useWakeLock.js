import { useState, useEffect, useRef } from 'react'

const useWakeLock = (enabled) => {
  const [isActive, setIsActive] = useState(false)
  const lockRef = useRef(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    const acquire = async () => {
      try {
        lockRef.current = await navigator.wakeLock.request('screen')
        setIsActive(true)
        lockRef.current.addEventListener('release', () => {
          setIsActive(false)
          lockRef.current = null
        })
      } catch {
        setIsActive(false)
      }
    }

    const release = () => {
      if (lockRef.current) {
        lockRef.current.release().catch(() => {})
        lockRef.current = null
        setIsActive(false)
      }
    }

    if (enabled) {
      acquire()
    } else {
      release()
    }

    return release
  }, [enabled])

  return { isActive }
}

export default useWakeLock
