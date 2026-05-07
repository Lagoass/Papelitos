import { useState, useRef, useEffect } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import { getColor } from '../../utils/colors.js'
import Button from '../../components/Button/index.jsx'

const WordInputScreen = () => {
  const { state, dispatch } = useGame()
  const { wordInputCurrentIndex, wordsPerPlayer, themes, mode } = state
  const color = getColor(wordInputCurrentIndex)

  const [fields, setFields] = useState(() => Array(wordsPerPlayer).fill(''))
  const [teamId, setTeamId] = useState(null)

  const inputRefs = useRef([])
  const confirmRef = useRef(null)
  // Stable ref to current fields — used in focus logic to avoid stale closures
  const fieldsRef = useRef(fields)

  const updateField = (i, value) => {
    setFields(prev => {
      const next = [...prev]
      next[i] = value
      fieldsRef.current = next
      return next
    })
  }

  // Focus first empty field on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const focusNext = (fromIndex) => {
    const f = fieldsRef.current
    // Search forward from fromIndex + 1
    for (let i = fromIndex + 1; i < wordsPerPlayer; i++) {
      if (f[i].trim() === '') { inputRefs.current[i]?.focus(); return }
    }
    // Wrap around from beginning
    for (let i = 0; i < fromIndex; i++) {
      if (f[i].trim() === '') { inputRefs.current[i]?.focus(); return }
    }
    // All filled
    confirmRef.current?.focus()
  }

  const handleKeyDown = (e, i) => {
    if (e.key === 'Enter') { e.preventDefault(); focusNext(i) }
  }

  const handleBlur = (i) => {
    if (fieldsRef.current[i].trim() !== '') focusNext(i)
  }

  const handleTeamSelect = (id) => {
    setTeamId(id)
    dispatch({ type: 'SET_PLAYER_TEAM', payload: id })
  }

  const allFilled = fields.every(f => f.trim() !== '')
  const canConfirm = allFilled && teamId !== null

  const handleConfirm = () => {
    if (!canConfirm) return
    const words = fields.map((text, i) => ({
      text: text.trim(),
      theme: mode === 'themed' ? (themes[i] ?? null) : null,
    }))
    dispatch({ type: 'PLAYER_CONFIRMED', payload: { words } })
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color }}>
          Jogador {wordInputCurrentIndex + 1}
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          Escolha seu time e insira suas {wordsPerPlayer} palavras
        </p>
      </div>

      {/* Seletor de time */}
      <section className="mb-6">
        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Seu time</p>
        <div className="flex gap-3">
          {['A', 'B'].map(id => (
            <button
              key={id}
              onClick={() => handleTeamSelect(id)}
              className={`flex-1 py-3 rounded-xl font-bold text-lg transition-colors ${
                teamId === id ? 'bg-white text-black' : 'bg-zinc-800 text-white'
              }`}
            >
              Time {id}
            </button>
          ))}
        </div>
      </section>

      {/* Campos de palavra */}
      <div className="flex-1 space-y-3 mb-6">
        {Array.from({ length: wordsPerPlayer }, (_, i) => (
          <div key={i}>
            {mode === 'themed' && (
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color }}>
                {themes[i]}
              </p>
            )}
            <input
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              value={fields[i]}
              onChange={e => updateField(i, e.target.value)}
              onKeyDown={e => handleKeyDown(e, i)}
              onBlur={() => handleBlur(i)}
              placeholder={`Palavra ${i + 1}`}
              className="w-full bg-zinc-800 text-white py-3 px-4 rounded-xl border focus:outline-none text-base"
              style={{
                borderColor: fields[i].trim() ? color : 'rgb(63 63 70)',
              }}
            />
          </div>
        ))}
      </div>

      <Button ref={confirmRef} onClick={handleConfirm} disabled={!canConfirm}>
        Confirmar
      </Button>
    </div>
  )
}

export default WordInputScreen
