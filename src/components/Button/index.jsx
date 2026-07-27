import { forwardRef } from 'react'

const VARIANTS = {
  primary:   'bg-white text-black',
  secondary: 'bg-zinc-800 text-white',
  danger:    'bg-red-500 text-white',
  ghost:     'border-2 border-zinc-600 text-white',
}

// Squash & stretch — UserInterface.md §4 "Pop": pressiona rápido (100ms),
// solta com overshoot elástico via easeOutBack. Vibração leve no toque
// (Android; no-op em iOS) — §3.5.
const Button = forwardRef(({ children, onClick, disabled = false, variant = 'primary', className = '', ...props }, ref) => {
  const handlePointerDown = (e) => {
    if (!disabled) {
      try { navigator.vibrate?.(10) } catch { /* sem suporte */ }
    }
    props.onPointerDown?.(e)
  }

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      {...props}
      onPointerDown={handlePointerDown}
      className={[
        'w-full py-4 rounded-2xl text-lg font-bold touch-manipulation',
        'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'active:scale-95 active:duration-100 active:ease-out',
        VARIANTS[variant] ?? VARIANTS.primary,
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
