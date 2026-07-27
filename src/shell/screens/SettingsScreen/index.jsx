import { useState } from 'react'
import { getTheme, cycleTheme, themeLabel } from '../../utils/themes.js'
import { GAMES } from '../../games.js'

// Configurações do HUB: tema (vale para todos os jogos) + regras de cada
// jogo, vindas do registry (games.js) — o shell não importa conteúdo de
// jogo diretamente, só o que o registry expõe.
const SettingsScreen = ({ onClose }) => {
  const [activeTheme, setActiveTheme] = useState(() => getTheme())
  const [openRule, setOpenRule] = useState(null) // `${gameId}-${index}`

  const handleCycleTheme = () => {
    const next = cycleTheme(activeTheme)
    setActiveTheme(next)
  }

  return (
    <div className="fixed inset-0 bg-black text-white z-40 overflow-y-auto">
      <div className="min-h-screen flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center mb-8 pt-2">
          <button
            onClick={onClose}
            className="text-zinc-300 text-2xl mr-4 leading-none active:scale-95 transition-transform"
            aria-label="Voltar"
          >
            ←
          </button>
          <h1 className="font-display text-2xl font-bold">Configurações</h1>
        </div>

        {/* Tema */}
        <section className="mb-8">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Tema</p>
          <button
            onClick={handleCycleTheme}
            className="w-full py-3 px-4 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-between active:scale-95 transition-transform"
          >
            <span className="font-semibold">{themeLabel(activeTheme)}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest">Próximo →</span>
          </button>
        </section>

        {/* Regras por jogo */}
        {GAMES.filter(g => g.rules?.length).map(game => (
          <section key={game.id} className="mb-6">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">
              Regras — {game.name}
            </p>
            <div className="space-y-2">
              {game.rules.map((rule, i) => {
                const key = `${game.id}-${i}`
                const isOpen = openRule === key
                return (
                  <div
                    key={key}
                    className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenRule(isOpen ? null : key)}
                      className="w-full px-4 py-3 flex justify-between items-center text-left"
                    >
                      <span className="font-semibold text-sm">{rule.title}</span>
                      <span className="text-zinc-500 text-lg leading-none">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                        {rule.body}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default SettingsScreen
