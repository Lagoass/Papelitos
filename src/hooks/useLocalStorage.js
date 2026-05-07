import { serialize, deserialize } from '../utils/storage.js'

const useLocalStorage = (key) => {
  const save = (state) => {
    try {
      localStorage.setItem(key, serialize(state))
    } catch {
      // quota exceeded ou private browsing — falha silenciosa
    }
  }

  const load = () => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      return deserialize(raw)
    } catch {
      return null
    }
  }

  const clear = () => {
    try {
      localStorage.removeItem(key)
    } catch {
      // falha silenciosa
    }
  }

  return { save, load, clear }
}

export default useLocalStorage
