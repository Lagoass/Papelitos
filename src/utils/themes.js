// Sistema de temas — aplicado via classe no <body>.
// CSS para cada tema vive em index.css. Mono = default (nenhuma classe).

const THEME_KEY = 'papelito_theme'

export const THEMES = [
  { id: 'mono',      label: 'Mono' },
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'minimal',   label: 'Minimal' },
  { id: 'casino',    label: 'Casino' },
  { id: 'junina',    label: 'Junina' },
  { id: 'light',     label: 'Light' },
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
  }
}

export const cycleTheme = (currentId) => {
  const idx = THEMES.findIndex(t => t.id === currentId)
  const next = THEMES[(idx + 1) % THEMES.length]
  applyTheme(next.id)
  return next.id
}

export const themeLabel = (id) => THEMES.find(t => t.id === id)?.label || 'Mono'
