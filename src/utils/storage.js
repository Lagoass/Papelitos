export const STORAGE_KEY = 'papelito_game_state'

export const serialize = (state) => JSON.stringify(state)

export const deserialize = (raw) => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
