import { useEffect, useRef, useState } from 'react'

// Conexão com a sala (Durable Object) — o coração do estudo da fase 3.
// Reconexão é cidadã de primeira classe (Change.md §4.4): identidade
// playerId+token persistida por sala, resync integral via WELCOME, backoff
// exponencial, retomada imediata quando a aba volta a ficar visível.
// RTT medido por ACK de cada ação (e por ping/pong do heartbeat).

const HEARTBEAT_MS = 20000
const MAX_BACKOFF_MS = 8000

const idKey = (code) => `lagames_mural_id_${code}`

const loadIdentity = (code) => {
  try { return JSON.parse(localStorage.getItem(idKey(code))) ?? {} } catch { return {} }
}
const saveIdentity = (code, id) => {
  try { localStorage.setItem(idKey(code), JSON.stringify(id)) } catch { /* segue sem persistir */ }
}

export const useRoom = ({ code, name }) => {
  const [status, setStatus] = useState('connecting') // connecting | online | reconnecting
  const [you, setYou] = useState(null)
  const [players, setPlayers] = useState([])
  const [notes, setNotes] = useState([])
  const [version, setVersion] = useState(0)
  const [rtt, setRtt] = useState({ last: null, avg: null })

  const wsRef = useRef(null)
  const seqRef = useRef(0)
  const pendingRef = useRef(new Map()) // seq → sentAt
  const versionRef = useRef(0)
  const attemptsRef = useRef(0)
  const leftRef = useRef(false)
  const retryTimerRef = useRef(null)
  const heartbeatRef = useRef(null)
  const pingAtRef = useRef(null)

  const trackRtt = (ms) => {
    setRtt(prev => ({ last: Math.round(ms), avg: Math.round(prev.avg == null ? ms : prev.avg * 0.7 + ms * 0.3) }))
  }

  useEffect(() => {
    leftRef.current = false
    versionRef.current = 0

    const connect = () => {
      if (leftRef.current) return
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const ws = new WebSocket(`${proto}://${location.host}/api/room/${code}/ws`)
      wsRef.current = ws

      ws.onopen = () => {
        attemptsRef.current = 0
        const identity = loadIdentity(code)
        ws.send(JSON.stringify({ type: 'JOIN', name, ...identity }))
      }

      ws.onmessage = (e) => {
        if (e.data === 'pong') {
          if (pingAtRef.current != null) trackRtt(performance.now() - pingAtRef.current)
          return
        }
        let msg
        try { msg = JSON.parse(e.data) } catch { return }

        if (msg.type === 'WELCOME') {
          saveIdentity(code, { playerId: msg.playerId, token: msg.token })
          setYou(msg.you)
          setPlayers(msg.state.players)
          setNotes(msg.state.notes)
          versionRef.current = msg.version
          setVersion(msg.version)
          setStatus('online')
        } else if (msg.type === 'STATE') {
          // números de sequência: descarta estado atrasado/fora de ordem
          if (msg.version > versionRef.current) {
            versionRef.current = msg.version
            setNotes(msg.notes)
            setVersion(msg.version)
          }
        } else if (msg.type === 'PRESENCE') {
          setPlayers(msg.players)
        } else if (msg.type === 'ACK') {
          const sentAt = pendingRef.current.get(msg.seq)
          if (sentAt != null) {
            pendingRef.current.delete(msg.seq)
            trackRtt(performance.now() - sentAt)
          }
        }
      }

      ws.onclose = () => {
        if (leftRef.current) return
        setStatus('reconnecting')
        const backoff = Math.min(1000 * 2 ** attemptsRef.current, MAX_BACKOFF_MS)
        attemptsRef.current++
        retryTimerRef.current = setTimeout(connect, backoff)
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' &&
          wsRef.current?.readyState !== WebSocket.OPEN && !leftRef.current) {
        clearTimeout(retryTimerRef.current)
        connect()
      }
    }

    connect()
    document.addEventListener('visibilitychange', onVisible)
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        pingAtRef.current = performance.now()
        wsRef.current.send('ping')
      }
    }, HEARTBEAT_MS)

    return () => {
      leftRef.current = true
      document.removeEventListener('visibilitychange', onVisible)
      clearTimeout(retryTimerRef.current)
      clearInterval(heartbeatRef.current)
      try { wsRef.current?.close() } catch { /* já fechado */ }
    }
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = (action) => {
    const ws = wsRef.current
    if (ws?.readyState !== WebSocket.OPEN) return false
    const seq = ++seqRef.current
    pendingRef.current.set(seq, performance.now())
    ws.send(JSON.stringify({ type: 'ACTION', seq, action }))
    return true
  }

  return { status, you, players, notes, version, rtt, send }
}
