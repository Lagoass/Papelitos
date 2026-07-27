// Confete em canvas — zero dependências, UserInterface.md §4.
// Uso: confettiRain() na vitória (clímax único). ≤100 partículas por chamada,
// respeita prefers-reduced-motion (vira no-op).
// Utilitário do SHELL: paleta própria (espelho das 12 cores de jogador) para
// não depender de nenhum módulo de jogo.
const PLAYER_COLORS = [
  '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#eab308',
  '#06b6d4', '#ef4444', '#84cc16', '#6366f1', '#14b8a6', '#d97706',
]

let canvas = null
let ctx = null
let particles = []
let rafId = null

const reducedMotion = () =>
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

const ensureCanvas = () => {
  if (canvas) return
  canvas = document.createElement('canvas')
  canvas.style.cssText =
    'position:fixed;inset:0;z-index:9990;pointer-events:none;'
  document.body.appendChild(canvas)
  ctx = canvas.getContext('2d')
  sizeCanvas()
  window.addEventListener('resize', sizeCanvas)
}

const sizeCanvas = () => {
  if (!canvas) return
  const d = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * d
  canvas.height = window.innerHeight * d
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
  ctx.setTransform(d, 0, 0, d, 0, 0)
}

const tick = () => {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  particles = particles.filter(p => p.life > 0 && p.y < window.innerHeight + 40)
  for (const p of particles) {
    p.vy += 0.35
    p.x += p.vx
    p.y += p.vy
    p.r += p.vr
    p.life--
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.r)
    ctx.globalAlpha = Math.min(1, p.life / 40)
    if (p.emoji) {
      ctx.font = '18px serif'
      ctx.fillText(p.emoji, -9, 6)
    } else {
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
    }
    ctx.restore()
  }
  if (particles.length) {
    rafId = requestAnimationFrame(tick)
  } else {
    rafId = null
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }
}

const spawn = (count, x, y, spreadDeg, power) => {
  ensureCanvas()
  for (let i = 0; i < count; i++) {
    const angle = ((-90 + (Math.random() - 0.5) * spreadDeg) * Math.PI) / 180
    const v = power * (0.6 + Math.random() * 0.8)
    particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      w: 5 + Math.random() * 5,
      h: 8 + Math.random() * 6,
      color: PLAYER_COLORS[(Math.random() * PLAYER_COLORS.length) | 0],
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 90 + Math.random() * 50,
      emoji: Math.random() < 0.1 ? (Math.random() < 0.5 ? '🎉' : '🏆') : null,
    })
  }
  if (!rafId) rafId = requestAnimationFrame(tick)
}

// Chuva de vitória — clímax grande, uma vez por partida
export const confettiRain = () => {
  if (reducedMotion()) return
  spawn(90, window.innerWidth / 2, window.innerHeight * 0.3, 160, 18)
}

// Burst pequeno e barato (uso futuro: acerto, confirmações)
export const confettiBurst = (x, y) => {
  if (reducedMotion()) return
  spawn(40, x, y, 70, 14)
}
