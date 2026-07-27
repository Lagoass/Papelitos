// Worker de borda — roteia /api/room/* para o Durable Object da sala.
// Contrato de rotas (docs/architecture/hub.md será atualizado ao fim da fase 3):
//   POST /api/room             → cria sala, retorna { code }
//   GET  /api/room/:code       → { exists }
//   GET  /api/room/:code/ws    → upgrade WebSocket (entra na sala)
export { MuralRoom } from './rooms/mural.js'

// Alfabeto sem ambíguos (0/O, 1/I) — códigos legíveis a um braço de distância.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const makeCode = () =>
  Array.from({ length: 4 }, () => ALPHABET[(Math.random() * ALPHABET.length) | 0]).join('')

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const parts = url.pathname.split('/').filter(Boolean) // ['api','room',code?,'ws'?]

    if (parts[0] !== 'api' || parts[1] !== 'room') {
      return json({ error: 'NOT_FOUND' }, 404)
    }

    // POST /api/room — cria a sala
    if (parts.length === 2 && request.method === 'POST') {
      const code = makeCode()
      const stub = env.MURAL_ROOM.get(env.MURAL_ROOM.idFromName(code))
      await stub.fetch('https://room/create')
      return json({ code })
    }

    const code = (parts[2] || '').toUpperCase()
    if (!/^[A-Z2-9]{4}$/.test(code)) return json({ error: 'INVALID_CODE' }, 400)

    const stub = env.MURAL_ROOM.get(env.MURAL_ROOM.idFromName(code))

    // GET /api/room/:code/ws — WebSocket para dentro do DO
    if (parts[3] === 'ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return json({ error: 'EXPECTED_WEBSOCKET' }, 426)
      }
      return stub.fetch(request)
    }

    // GET /api/room/:code — existe?
    if (parts.length === 3 && request.method === 'GET') {
      return stub.fetch('https://room/info')
    }

    return json({ error: 'NOT_FOUND' }, 404)
  },
}
