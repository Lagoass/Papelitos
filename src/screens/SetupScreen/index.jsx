import { useState } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import Button from '../../components/Button/index.jsx'

const SetupScreen = () => {
  const { state, dispatch } = useGame()
  const { mode, turnDuration, wordsPerPlayer, themes } = state
  const [themeInput, setThemeInput] = useState('')

  const addTheme = () => {
    const trimmed = themeInput.trim()
    if (!trimmed || themes.includes(trimmed)) return
    dispatch({ type: 'ADD_THEME', payload: trimmed })
    setThemeInput('')
  }

  const canContinue = mode === 'normal' || themes.length > 0

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6">
      <h1 className="text-4xl font-black text-center mb-10 tracking-tight">Papelito</h1>

      {/* Modo */}
      <section className="mb-7">
        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Modo</p>
        <div className="flex gap-3">
          {['normal', 'themed'].map(m => (
            <button
              key={m}
              onClick={() => dispatch({ type: 'SET_MODE', payload: m })}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                mode === m ? 'bg-white text-black' : 'bg-zinc-800 text-white'
              }`}
            >
              {m === 'normal' ? 'Normal' : 'Temático'}
            </button>
          ))}
        </div>
      </section>

      {/* Tempo de turno */}
      <section className="mb-7">
        <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-2">
          Tempo por turno (segundos)
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={10}
          max={300}
          value={turnDuration}
          onChange={e => dispatch({ type: 'SET_TURN_DURATION', payload: Math.max(10, Number(e.target.value)) })}
          className="w-full bg-zinc-800 text-white text-xl text-center py-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-white"
        />
      </section>

      {/* Palavras por jogador — Modo Normal */}
      {mode === 'normal' && (
        <section className="mb-7">
          <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-2">
            Palavras por jogador
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={wordsPerPlayer}
            onChange={e => dispatch({ type: 'SET_WORDS_PER_PLAYER', payload: Math.max(1, Number(e.target.value)) })}
            className="w-full bg-zinc-800 text-white text-xl text-center py-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-white"
          />
        </section>
      )}

      {/* Temas — Modo Temático */}
      {mode === 'themed' && (
        <section className="mb-7 flex-1">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">
            Temas&nbsp;
            <span className="text-white">
              ({themes.length} {themes.length === 1 ? 'palavra' : 'palavras'} por jogador)
            </span>
          </p>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={themeInput}
              onChange={e => setThemeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTheme()}
              placeholder="Ex: Uma profissão..."
              className="flex-1 bg-zinc-800 text-white py-3 px-4 rounded-xl border border-zinc-700 focus:outline-none focus:border-white"
            />
            <button
              onClick={addTheme}
              disabled={!themeInput.trim() || themes.includes(themeInput.trim())}
              className="px-5 py-3 bg-white text-black rounded-xl font-bold text-lg disabled:opacity-40"
            >
              +
            </button>
          </div>

          {themes.length > 0 && (
            <ul className="space-y-2">
              {themes.map((theme, i) => (
                <li key={i} className="flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-xl">
                  <span className="text-sm">{i + 1}. {theme}</span>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_THEME', payload: theme })}
                    className="text-zinc-500 hover:text-white ml-4 text-lg leading-none"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="mt-auto pt-6">
        <Button onClick={() => dispatch({ type: 'SETUP_COMPLETE' })} disabled={!canContinue}>
          Continuar
        </Button>
      </div>
    </div>
  )
}

export default SetupScreen
