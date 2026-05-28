// Sistema de temas — aplicado via classe no <body>.
// CSS para cada tema vive em index.css. Mono = default (nenhuma classe).

const THEME_KEY = 'papelito_theme'

export const THEMES = [
  { id: 'mono',      label: 'Mono',      bg: '#000000' },
  { id: 'synthwave', label: 'Synthwave', bg: '#0f0820' },
  { id: 'minimal',   label: 'Minimal',   bg: '#09090b' },
  { id: 'casino',    label: 'Casino',    bg: '#052e16' },
  { id: 'junina',    label: 'Junina',    bg: '#1c0a0a' },
  { id: 'light',     label: 'Light',     bg: '#fef9f0' },
]

export const DEFAULT_THEME = 'mono'

export const getTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return THEMES.find(t => t.id === stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export const applyTheme = (id) => {
  try {
    localStorage.setItem(THEME_KEY, id)
  } catch {}
  if (typeof document !== 'undefined') {
    // Aplica em html E body — html cobre a safe-area do recorte da câmera,
    // body cobre o conteúdo. Sem isso, há uma "costura" visível no topo.
    for (const el of [document.documentElement, document.body]) {
      el.classList.forEach(cls => {
        if (cls.startsWith('theme-')) el.classList.remove(cls)
      })
      el.classList.add(`theme-${id}`)
    }
    // Sincroniza o <meta name="theme-color"> com o bg do tema.
    // Em alguns Androids, a safe-area da câmera é pintada com esse valor —
    // se ficar diferente do body, surge uma "linha cinza" no topo.
    const theme = THEMES.find(t => t.id === id)
    if (theme) {
      let meta = document.querySelector('meta[name="theme-color"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'theme-color'
        document.head.appendChild(meta)
      }
      meta.content = theme.bg
    }
  }
}

export const cycleTheme = (currentId) => {
  const idx = THEMES.findIndex(t => t.id === currentId)
  const next = THEMES[(idx + 1) % THEMES.length]
  applyTheme(next.id)
  return next.id
}

export const themeLabel = (id) => THEMES.find(t => t.id === id)?.label || 'Mono'
