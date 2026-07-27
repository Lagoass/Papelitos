import { forwardRef } from 'react'

const VARIANTS = {
  primary:   'bg-white text-black',
  secondary: 'bg-zinc-800 text-white',
  success:   'bg-green-500 text-green-950',
  danger:    'bg-red-500 text-white',
  ghost:     'border-2 border-zinc-600 text-white',
}

// Squash & stretch — UserInterface.md §4 "Pop": pressiona rápido (100ms),
// solta com overshoot elástico via easeOutBack. Vibração NÃO vive aqui:
// haptics são sinal de momento-chave (shell/utils/haptics.js), não ruído
// de todo toque.
const Button = forwardRef(({ children, onClick, disabled = false, variant = 'primary', className = '', ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    disabled={disabled}
    className={[
      'w-full py-4 rounded-2xl text-lg font-bold touch-manipulation',
      'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
      'active:scale-95 active:duration-100 active:ease-out',
      VARIANTS[variant] ?? VARIANTS.primary,
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </button>
))

Button.displayName = 'Button'

export default Button
