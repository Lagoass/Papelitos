import { useState, useEffect } from 'react'
import Button from '../Button/index.jsx'

const CountdownLock = ({ onConfirm, seconds = 5, children, variant = 'primary', className = '' }) => {
  const [remaining, setRemaining] = useState(seconds)
  const locked = remaining > 0

  useEffect(() => {
    if (!locked) return
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, locked])

  return (
    <Button
      onClick={locked ? undefined : onConfirm}
      disabled={locked}
      variant={variant}
      className={className}
    >
      {locked ? `${children} (${remaining})` : children}
    </Button>
  )
}

export default CountdownLock
