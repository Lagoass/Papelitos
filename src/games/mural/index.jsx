import { useState } from 'react'
import Button from '@shell/components/Button/index.jsx'
import { useRoom } from './useRoom.js'

// Mural de Papelitos — bancada de teste da categoria Todos Conectados.
// Descartável por design: existe para validar salas, latência, reconexão e
// persistência do Durable Object antes do primeiro jogo conectado de verdade.

const NAME_KEY = 'lagames_player_name'
const loadName = () => { try { return localStorage.getItem(NAME_KEY) ?? '' } catch { return '' } }
const saveName = (n) => { try { localStorage.setItem(NAME_KEY, n) } catch { /* segue */ } }

// ── Lobby: criar ou entrar por código ─────────────────────────────────────
const Lobby = ({ onEnter, onExit }) => {
  const [name, setName] = useState(loadName)
  const [codeInput, setCodeInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const commitName = (n) => { setName(n); saveName(n) }

  const create = async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/room', { method: 'POST' })
      const { code } = await res.json()
      onEnter(code, name)
    } catch {
      setError('Servidor fora do ar. O `npm run server` está rodando?')
    } finally { setBusy(false) }
  }

  const join = async () => {
    const code = codeInput.trim().toUpperCase()
    if (code.length !== 4) { setError('O código tem 4 letras.'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/room/${code}`)
      const { exists } = await res.json()
      if (!exists) { setError(`Sala ${code} não existe (ou expirou).`); return }
      onEnter(code, name)
    } catch {
      setError('Servidor fora do ar. O `npm run server` está rodando?')
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6">
      <div className="relative mb-8">
        <h1 className="font-display text-4xl font-bold text-center tracking-tight">Mural 📌</h1>
        <button
          onClick={onExit}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl leading-none text-zinc-300 active:scale-90 transition-transform"
          aria-label="Voltar para a home"
        >
          ←
        </button>
      </div>

      <p className="text-sm text-zinc-400 text-center mb-8 max-w-[34ch] mx-auto">
        Bancada de teste do tempo real: cada um no seu celular, todos vendo o mesmo mural.
      </p>

      <section className="mb-7">
        <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-2">Seu nome</label>
        <input
          type="text"
          value={name}
          maxLength={24}
          onChange={e => commitName(e.target.value)}
          placeholder="Como te chamam na mesa?"
          className="w-full bg-zinc-800 text-white text-base py-3 px-4 rounded-xl border border-zinc-700 focus:outline-none focus:border-white"
        />
      </section>

      <Button onClick={create} disabled={busy} className="mb-6">
        Criar mural 📜
      </Button>

      <div className="flex items-center gap-3 mb-6 text-zinc-600 text-xs uppercase tracking-widest">
        <div className="flex-1 h-px bg-zinc-800" /> ou <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <section className="mb-4">
        <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-2">Código da sala</label>
        <input
          type="text"
          value={codeInput}
          maxLength={4}
          onChange={e => setCodeInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && join()}
          placeholder="ABCD"
          autoCapitalize="characters"
          autoCorrect="off"
          className="w-full bg-zinc-800 text-white font-display text-3xl text-center tracking-[0.4em] py-3 px-4 rounded-xl border border-zinc-700 focus:outline-none focus:border-white uppercase"
        />
      </section>

      <Button variant="secondary" onClick={join} disabled={busy || codeInput.length !== 4}>
        Entrar na sala
      </Button>

      {error && (
        <p className="text-red-400 text-sm text-center mt-5">{error}</p>
      )}
    </div>
  )
}

// ── Board: o mural em si ──────────────────────────────────────────────────
const STATUS_DOT = {
  online: 'bg-green-500',
  connecting: 'bg-amber-400 animate-pulse',
  reconnecting: 'bg-amber-400 animate-pulse',
}

const Board = ({ code, name, onLeave }) => {
  const { status, you, players, notes, version, rtt, send } = useRoom({ code, name })
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  const playerById = Object.fromEntries(players.map(p => [p.id, p]))

  const add = () => {
    const text = draft.trim()
    if (!text) return
    if (send({ type: 'ADD_NOTE', text })) setDraft('')
  }

  const saveEdit = () => {
    if (send({ type: 'EDIT_NOTE', id: editingId, text: editDraft.trim() })) {
      setEditingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 gap-4">
      {/* Header: sala + conexão */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onLeave}
          className="text-2xl leading-none text-zinc-300 active:scale-90 transition-transform"
          aria-label="Sair da sala"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="font-display text-2xl font-bold tracking-[0.2em] leading-none">{code}</p>
          <p className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">
            código da sala — passa pros amigos
          </p>
        </div>
        {/* Debug do estudo: RTT + versão do estado + status */}
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-1 text-xs tabular-nums">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status] ?? 'bg-red-500'}`} />
            {rtt.last != null ? `${rtt.last}ms` : '—'} · v{version}
          </span>
        </div>
      </div>

      {/* Presença */}
      <div className="flex flex-wrap gap-2">
        {players.map(p => (
          <span
            key={p.id}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-zinc-900 border border-zinc-700 ${p.online ? '' : 'opacity-40'}`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}{you?.id === p.id ? ' (você)' : ''}
          </span>
        ))}
      </div>

      {/* Mural */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {notes.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center mt-16">
            Mural vazio… cola o primeiro papelito! 📜
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {notes.map((note, i) => {
              const author = playerById[note.authorId]
              const color = author?.color ?? '#71717a'
              const mine = you?.id === note.authorId
              const editing = editingId === note.id
              return (
                <div
                  key={note.id}
                  className={`anim-fade-up rounded-2xl border-2 p-3 flex flex-col gap-2 ${i % 2 ? 'rotate-1' : '-rotate-1'}`}
                  style={{ borderColor: color, backgroundColor: `${color}18` }}
                >
                  {editing ? (
                    <>
                      <textarea
                        value={editDraft}
                        onChange={e => setEditDraft(e.target.value)}
                        maxLength={280}
                        rows={3}
                        className="w-full bg-black/30 text-white text-base rounded-lg p-2 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2 text-xs font-bold">
                        <button onClick={saveEdit} className="flex-1 bg-white text-black rounded-lg py-1.5">Salvar</button>
                        <button
                          onClick={() => { send({ type: 'DELETE_NOTE', id: note.id }); setEditingId(null) }}
                          className="flex-1 bg-red-500/80 rounded-lg py-1.5"
                        >
                          Apagar
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex-1 bg-zinc-700 rounded-lg py-1.5">✕</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p
                        className="text-sm font-semibold break-words whitespace-pre-wrap flex-1"
                        style={{ color }}
                        onClick={() => { if (mine) { setEditingId(note.id); setEditDraft(note.text) } }}
                      >
                        {note.text}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest opacity-60" style={{ color }}>
                        {author?.name ?? '?'}{mine ? ' · toca pra editar' : ''}
                      </p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Colar papelito */}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          maxLength={280}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Escreve um papelito…"
          className="flex-1 bg-zinc-800 text-white text-base py-3 px-4 rounded-xl border border-zinc-700 focus:outline-none focus:border-white"
        />
        <button
          onClick={add}
          disabled={!draft.trim() || status !== 'online'}
          className="px-5 bg-white text-black rounded-xl font-bold text-xl disabled:opacity-40 active:scale-95 transition-transform touch-manipulation"
        >
          📌
        </button>
      </div>
    </div>
  )
}

// ── Entry do módulo (contrato do shell: onExit) ───────────────────────────
const MuralGame = ({ onExit }) => {
  const [room, setRoom] = useState(null) // { code, name }

  return room ? (
    <Board code={room.code} name={room.name} onLeave={() => setRoom(null)} />
  ) : (
    <Lobby onEnter={(code, name) => setRoom({ code, name })} onExit={onExit} />
  )
}

export default MuralGame
