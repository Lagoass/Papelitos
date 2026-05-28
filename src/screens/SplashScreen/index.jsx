import { useEffect, useState } from 'react'

// Splash interno renderizado nos primeiros ms após a montagem do App.
// - Suaviza a transição do splash nativo do Android (icone rígido) para a UI.
// - Duração aleatória entre MIN_MS e MAX_MS — orgânico, não parece script fixo.
// - Logo com border-radius arredondado + fade-out + leve scale-up no final.

const MIN_MS = 200
const MAX_MS = 1000
const FADE_MS = 250

const SplashScreen = ({ onDone }) => {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const hold = MIN_MS + Math.random() * (MAX_MS - MIN_MS)
    const fadeTimer = setTimeout(() => setFading(true), hold)
    const doneTimer = setTimeout(onDone, hold + FADE_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`transition-transform duration-300 ${
          fading ? 'scale-110' : 'scale-100'
        }`}
      >
        <img
          src="/icons/icon-512.png"
          alt="Papelito"
          className="w-32 h-32 rounded-3xl shadow-2xl"
          draggable={false}
        />
      </div>
    </div>
  )
}

export default SplashScreen
