import { useState } from 'react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js'

// Banner dismissível exibido no rodapé inferior do SetupScreen quando o PWA é instalável.
// - Em Chrome/Edge/Samsung Internet: dispara o prompt nativo via beforeinstallprompt.
// - Em iOS Safari: abre um modal com instruções manuais (Compartilhar → Adicionar à Tela Inicial).

const IOSInstructions = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6">
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full">
      <h2 className="text-xl font-bold mb-4">Instalar no iPhone</h2>
      <ol className="space-y-3 text-sm text-zinc-300 leading-relaxed mb-6">
        <li>1. Toque no botão <span className="font-semibold text-white">Compartilhar</span> ⬆️ na barra do Safari.</li>
        <li>2. Role e selecione <span className="font-semibold text-white">"Adicionar à Tela de Início"</span>.</li>
        <li>3. Toque em <span className="font-semibold text-white">Adicionar</span> no canto superior direito.</li>
      </ol>
      <button
        onClick={onClose}
        className="w-full py-3 bg-white text-black rounded-xl font-semibold"
      >
        Entendi
      </button>
    </div>
  </div>
)

const InstallBanner = () => {
  const { canShow, ios, promptInstall, dismiss } = useInstallPrompt()
  const [showIOS, setShowIOS] = useState(false)

  if (!canShow) return null

  const handleInstall = async () => {
    if (ios) {
      setShowIOS(true)
      return
    }
    const outcome = await promptInstall()
    if (outcome === 'dismissed') dismiss()
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 z-40 shadow-2xl flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Instalar Papelito</p>
          <p className="text-xs text-zinc-400 leading-snug mt-0.5">
            Adicione à tela inicial para abrir em tela cheia.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-zinc-500 text-lg leading-none px-2 active:scale-90 transition-transform"
          aria-label="Dispensar"
        >
          ✕
        </button>
        <button
          onClick={handleInstall}
          className="bg-white text-black px-4 py-2 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
        >
          Instalar
        </button>
      </div>

      {showIOS && <IOSInstructions onClose={() => setShowIOS(false)} />}
    </>
  )
}

export default InstallBanner
