import { useState, useRef, useEffect } from 'react'

const useTimer = ({ duration, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef(null)
  const onEndRef = useRef(onEnd)
  const endedRef = useRef(false)

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
    endedRef.current = false
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      // updater puro — apenas atualiza o estado
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
  }

  // Side effect separado: detecta quando o timer zera e dispara onEnd uma única vez
  useEffect(() => {
    if (timeLeft === 0 && isRunning && !endedRef.current) {
      endedRef.current = true
      clearTimer()
      setIsRunning(false)
      onEndRef.current?.()
    }
  }, [timeLeft, isRunning])

  const pause = () => {
    clearTimer()
    setIsRunning(false)
  }

  const reset = () => {
    clearTimer()
    setIsRunning(false)
    setTimeLeft(duration)
    endedRef.current = false
  }

  useEffect(() => clearTimer, [])

  return { timeLeft, isRunning, start, pause, reset }
}

export default useTimer
