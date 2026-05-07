import { useState, useRef, useEffect } from 'react'

const useTimer = ({ duration, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)
  const onEndRef = useRef(onEnd)

  useEffect(() => {
    onEndRef.current = onEnd
  }, [onEnd])

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const start = () => {
    if (isRunning) return
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setIsRunning(false)
          onEndRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const pause = () => {
    clearTimer()
    setIsRunning(false)
  }

  const reset = () => {
    clearTimer()
    setIsRunning(false)
    setTimeLeft(duration)
  }

  useEffect(() => clearTimer, [])

  return { timeLeft, isRunning, start, pause, reset }
}

export default useTimer
