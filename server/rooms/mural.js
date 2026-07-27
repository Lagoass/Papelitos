// MuralRoom — Durable Object de sala do Mural de Papelitos.
// Bancada de teste da categoria "Todos Conectados" (Change.md fase 3):
// exercita salas, WebSocket Hibernation, reducer autoritativo, presença,
// reconexão com token e persistência — com o reducer mais simples possível
// (post-its atômicos: adicionar/editar/apagar; sem merge de texto/CRDT).
//
// Protocolo (Change.md §4.3):
//   cliente → servidor: JOIN { name, playerId?, token? } | ACTION { seq, action } | 'ping'
//   servidor → cliente: WELCOME { playerId, token, state, version }
//                       STATE { notes, version } | PRESENCE { players }
//                       ACK { seq, serverTime } | ERROR { code } | 'pong'

const TTL_MS = 24 * 60 * 60 * 1000 // sala expira após 24h sem atividade
const MAX_NOTE_LEN = 280
const MAX_NOTES = 200

// Espelho da paleta de jogadores (mesma dos módulos do cliente)
const PLAYER_COLORS = [
  '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#eab308',
  '#06b6d4', '#ef4444', '#84cc16', '#6366f1', '#14b8a6', '#d97706',
]

export class MuralRoom {
  constructor(ctx) {
    this.ctx = ctx
    this.ctx.blockConcurrencyWhile(async () => {
      this.meta = (await ctx.storage.get('meta')) ?? null
      this.players = (await ctx.storage.get('players')) ?? {} // id → { id, token, name, color }
      this.notes = (await ctx.storage.get('notes')) ?? []     // [{ id, text, authorId, at }]
      this.version = (await ctx.storage.get('version')) ?? 0
    })
    // Heartbeat sem acordar o DO — hibernação preservada
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
  }

  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/create') {
      if (!this.meta) {
        this.meta = { createdAt: Date.now() }
        await this.ctx.storage.put('meta', this.meta)
        await this.ctx.storage.setAlarm(Date.now() + TTL_MS)
      }
      return Response.json({ ok: true })
    }

    if (url.pathname === '/info') {
      return Response.json({ exists: !!this.meta })
    }

    // upgrade WebSocket (rota .../ws vinda do worker)
    if (request.headers.get('Upgrade') === 'websocket') {
      if (!this.meta) return Response.json({ error: 'ROOM_NOT_FOUND' }, { status: 404 })
      const pair = new WebSocketPair()
      this.ctx.acceptWebSocket(pair[1])
      return new Response(null, { status: 101, webSocket: pair[0] })
    }

    return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  // ── mensagens ────────────────────────────────────────────────────────────
  async webSocketMessage(ws, raw) {
    let msg
    try { msg = JSON.parse(raw) } catch { return }
    await this.touch()

    if (msg.type === 'JOIN') return this.handleJoin(ws, msg)
    if (msg.type === 'ACTION') return this.handleAction(ws, msg)
  }

  async handleJoin(ws, { name, playerId, token }) {
    let player = playerId && this.players[playerId]

    if (player && player.token === token) {
      // reconexão — identidade preservada
      if (name?.trim()) player.name = name.trim().slice(0, 24)
    } else {
      const id = crypto.randomUUID()
      player = {
        id,
        token: crypto.randomUUID(),
        name: (name?.trim() || `Jogador ${Object.keys(this.players).length + 1}`).slice(0, 24),
        color: PLAYER_COLORS[Object.keys(this.players).length % PLAYER_COLORS.length],
      }
      this.players[id] = player
    }
    await this.persist()

    // identidade sobrevive à hibernação junto com o socket
    ws.serializeAttachment({ playerId: player.id })

    ws.send(JSON.stringify({
      type: 'WELCOME',
      playerId: player.id,
      token: player.token,
      you: { id: player.id, name: player.name, color: player.color },
      state: { notes: this.notes, players: this.publicPlayers() },
      version: this.version,
    }))
    this.broadcastPresence()
  }

  async handleAction(ws, { seq, action }) {
    const attachment = ws.deserializeAttachment()
    const player = attachment && this.players[attachment.playerId]
    if (!player) {
      ws.send(JSON.stringify({ type: 'ERROR', code: 'NOT_JOINED' }))
      return
    }

    const changed = this.apply(action, player)
    if (changed) {
      this.version++
      await this.persist()
      this.broadcast({ type: 'STATE', notes: this.notes, version: this.version })
    }
    // ACK sempre — o cliente mede RTT mesmo em ação rejeitada
    ws.send(JSON.stringify({ type: 'ACK', seq, applied: changed, serverTime: Date.now() }))
  }

  // Reducer autoritativo — ações atômicas, autor manda na própria nota
  apply(action, player) {
    switch (action?.type) {
      case 'ADD_NOTE': {
        const text = String(action.text ?? '').trim().slice(0, MAX_NOTE_LEN)
        if (!text || this.notes.length >= MAX_NOTES) return false
        this.notes.push({ id: crypto.randomUUID(), text, authorId: player.id, at: Date.now() })
        return true
      }
      case 'EDIT_NOTE': {
        const note = this.notes.find(n => n.id === action.id)
        if (!note || note.authorId !== player.id) return false
        const text = String(action.text ?? '').trim().slice(0, MAX_NOTE_LEN)
        if (!text) return false
        note.text = text
        return true
      }
      case 'DELETE_NOTE': {
        const before = this.notes.length
        this.notes = this.notes.filter(n => !(n.id === action.id && n.authorId === player.id))
        return this.notes.length !== before
      }
      default:
        return false
    }
  }

  // ── presença e ciclo de vida ─────────────────────────────────────────────
  // O socket que está fechando pode ainda constar em getWebSockets() durante
  // o handler de close — excluímos explicitamente para a presença ser correta.
  webSocketClose(ws) { this.broadcastPresence(ws) }
  webSocketError(ws) { this.broadcastPresence(ws) }

  publicPlayers(excludeWs = null) {
    const online = new Set(
      this.ctx.getWebSockets()
        .filter(s => s !== excludeWs)
        .map(s => { try { return s.deserializeAttachment()?.playerId } catch { return null } })
        .filter(Boolean)
    )
    return Object.values(this.players).map(({ id, name, color }) => ({
      id, name, color, online: online.has(id),
    }))
  }

  broadcastPresence(excludeWs = null) {
    this.broadcast({ type: 'PRESENCE', players: this.publicPlayers(excludeWs) })
  }

  broadcast(msg) {
    const data = JSON.stringify(msg)
    for (const s of this.ctx.getWebSockets()) {
      try { s.send(data) } catch { /* socket morto — close vem em seguida */ }
    }
  }

  async persist() {
    await this.ctx.storage.put({
      players: this.players,
      notes: this.notes,
      version: this.version,
    })
  }

  async touch() {
    await this.ctx.storage.setAlarm(Date.now() + TTL_MS)
  }

  // TTL: sala sem atividade por 24h evapora
  async alarm() {
    await this.ctx.storage.deleteAll()
    this.meta = null
    this.players = {}
    this.notes = []
    this.version = 0
    for (const s of this.ctx.getWebSockets()) {
      try { s.close(1000, 'ROOM_EXPIRED') } catch { /* já fechado */ }
    }
  }
}
