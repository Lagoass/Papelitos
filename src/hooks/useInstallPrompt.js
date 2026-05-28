import { useEffect, useState, useCallback } from 'react'

// Hook que gerencia o prompt nativo de instalação de PWA.
// - Captura o evento beforeinstallprompt (Chrome/Edge/Samsung Internet) e o stash em ref de state.
// - Detecta se o app já está rodando como PWA (display-mode standalone/fullscreen) — esconde o prompt.
// - Detecta iOS (Safari não dispara beforeinstallprompt) → expõe flag para mostrar instruções manuais.
// - Persiste dismissal em localStorage para não atormentar o usuário.

const DISMISS_KEY = 'papelito_install_dismissed'

const isStandalone = () => {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true // iOS
  )
}

const isIOS = () => {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

const wasDismissed = () => {
  try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
}

export const useInstallPrompt = () => {
  const [deferredEvent, setDeferredEvent] = useState(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [dismissed, setDismissed] = useState(() => wasDismissed())
  const ios = isIOS()

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredEvent(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return null
    deferredEvent.prompt()
    const choice = await deferredEvent.userChoice
    setDeferredEvent(null)
    return choice.outcome // 'accepted' | 'dismissed'
  }, [deferredEvent])

  const dismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
    setDismissed(true)
  }, [])

  // Banner aparece se: não está rodando como PWA, não foi dispensado, e
  // (tem evento nativo disponível OU é iOS — que precisa de instruções manuais).
  const canShow = !installed && !dismissed && (deferredEvent !== null || ios)

  return { canShow, ios, installed, dismissed, promptInstall, dismiss }
}
