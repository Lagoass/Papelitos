import { useState } from 'react'
import { GAMES, CATEGORIES, getSavedGame } from '../../games.js'
import SettingsScreen from '../SettingsScreen/index.jsx'
import InstallBanner from '../../components/InstallBanner/index.jsx'

// Home do hub — UserInterface.md §6.1: layout bento, card-herói com arte
// sem texto (gradiente + emoji-personagem), categorias como seções
// empilhadas, "Continuar partida" em 1 toque, entrada com stagger.

const ContinueCard = ({ game, saved, onPlay, delay }) => (
  <button
    onClick={() => onPlay(game.id, { resume: true })}
    className="anim-fade-up w-full flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-left active:scale-[0.97] transition-transform anim-glow-pulse"
    style={{ animationDelay: `${delay}ms`, '--glow-color': `${game.accent}40` }}
  >
    <span className="text-2xl">{game.emoji}</span>
    <span className="flex-1 min-w-0">
      <span className="block font-bold text-sm">Continuar partida</span>
      <span className="block text-xs text-zinc-400">
        {game.name} · Rodada {saved.round}
      </span>
    </span>
    <span className="text-xl font-black" style={{ color: game.accent }}>→</span>
  </button>
)

const HeroCard = ({ game, onPlay, delay }) => (
  <button
    onClick={() => onPlay(game.id)}
    className="anim-fade-up relative w-full aspect-[16/10] rounded-3xl overflow-hidden flex flex-col items-start justify-end p-5 text-left active:scale-[0.97] transition-transform"
    style={{ animationDelay: `${delay}ms`, background: game.gradient }}
  >
    <span
      className="absolute -top-2 right-2 text-8xl drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)] -rotate-[10deg]"
      aria-hidden="true"
    >
      {game.emoji}
    </span>
    <span className="font-display font-bold text-3xl text-black/85">{game.name}</span>
    <span className="text-sm font-semibold text-black/60">{game.meta}</span>
  </button>
)

const GhostCard = ({ delay }) => (
  <div
    className="anim-fade-up w-full aspect-[16/10] rounded-3xl border-2 border-dashed border-zinc-800 flex items-center justify-center"
    style={{ animationDelay: `${delay}ms` }}
  >
    <span className="text-zinc-600 font-bold">+ Em breve</span>
  </div>
)

const HomeScreen = ({ onPlay }) => {
  const [showSettings, setShowSettings] = useState(false)

  const continues = GAMES
    .map(g => ({ game: g, saved: getSavedGame(g) }))
    .filter(c => c.saved !== null)

  const byCategory = (cat) => GAMES.filter(g => g.category === cat)

  let delay = 0
  const nextDelay = () => (delay += 70)

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col p-6 overflow-hidden">
      {/* Fundo vivo — blobs que respiram (UserInterface.md §3.3) */}
      <div className="blob-bg" style={{ top: '-90px', left: '-110px', background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} aria-hidden="true" />
      <div className="blob-bg blob-bg-alt" style={{ bottom: '-120px', right: '-110px', background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} aria-hidden="true" />

      <div className="relative flex flex-col gap-6">
        {/* Header */}
        <div className="anim-fade-up flex items-center justify-between pt-2" style={{ animationDelay: '0ms' }}>
          <h1 className="font-display text-3xl font-bold tracking-tight">Papelito</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="text-2xl leading-none active:scale-90 transition-transform"
            aria-label="Configurações"
          >
            ⚙️
          </button>
        </div>

        {/* Continuar partida — 1 toque, acima de tudo */}
        {continues.map(({ game, saved }) => (
          <ContinueCard key={game.id} game={game} saved={saved} onPlay={onPlay} delay={nextDelay()} />
        ))}

        {/* Categoria: um celular */}
        <section>
          <p className="anim-fade-up text-xs text-zinc-500 uppercase tracking-widest mb-3" style={{ animationDelay: `${nextDelay()}ms` }}>
            {CATEGORIES.pass.label}
          </p>
          <div className="space-y-3">
            {byCategory('pass').map(g => (
              <HeroCard key={g.id} game={g} onPlay={onPlay} delay={nextDelay()} />
            ))}
          </div>
        </section>

        {/* Categoria: cada um no seu */}
        <section>
          <p className="anim-fade-up text-xs text-zinc-500 uppercase tracking-widest mb-3" style={{ animationDelay: `${nextDelay()}ms` }}>
            {CATEGORIES.connected.label}
          </p>
          <GhostCard delay={nextDelay()} />
        </section>
      </div>

      {/* Overlay de configurações (tema + regras) */}
      {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}

      {/* Banner de instalação do PWA */}
      <InstallBanner />
    </div>
  )
}

export default HomeScreen
