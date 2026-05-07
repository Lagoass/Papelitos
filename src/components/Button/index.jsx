import { forwardRef } from 'react'

const VARIANTS = {
  primary:   'bg-white text-black',
  secondary: 'bg-zinc-800 text-white',
  danger:    'bg-red-500 text-white',
  ghost:     'border-2 border-zinc-600 text-white',
}

const Button = forwardRef(({ children, onClick, disabled = false, variant = 'primary', className = '', ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    disabled={disabled}
    className={[
      'w-full py-4 rounded-2xl text-lg font-bold transition-all active:scale-95',
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
