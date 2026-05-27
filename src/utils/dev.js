// Modo de desenvolvimento — pula o setup de jogadores e palavras,
// gera estado completo automaticamente e vai direto pra roleta.
//
// O estado do TEST_MODE vive em localStorage e pode ser alternado em runtime
// via combo secreto no SetupScreen: numTeams=4, turnDuration=44, wordsPerPlayer=4.
//
// DEFAULT_TEST_MODE define o valor para usuários que nunca alternaram. Para
// builds de produção, manter como false.

const TEST_MODE_KEY = 'papelito_test_mode'
const DEFAULT_TEST_MODE = false

export const isTestMode = () => {
  try {
    const stored = localStorage.getItem(TEST_MODE_KEY)
    return stored === null ? DEFAULT_TEST_MODE : stored === 'true'
  } catch {
    return DEFAULT_TEST_MODE
  }
}

export const setTestMode = (value) => {
  try {
    localStorage.setItem(TEST_MODE_KEY, String(value))
  } catch {}
}

// Combo secreto que alterna TEST_MODE quando aplicado na SetupScreen.
export const TOGGLE_COMBO = {
  numTeams: 4,
  turnDuration: 44,
  wordsPerPlayer: 4,
}

export const matchesToggleCombo = ({ numTeams, turnDuration, wordsPerPlayer }) =>
  numTeams === TOGGLE_COMBO.numTeams &&
  turnDuration === TOGGLE_COMBO.turnDuration &&
  wordsPerPlayer === TOGGLE_COMBO.wordsPerPlayer

// Pool de palavras fake — ~60 itens, suficiente para até 4 times × 2 jogadores × 7 palavras.
export const FAKE_WORDS = [
  'Banana', 'Cadeira', 'Avião', 'Janela', 'Sapato', 'Garfo', 'Bicicleta',
  'Telefone', 'Geladeira', 'Caderno', 'Lápis', 'Espelho', 'Travesseiro',
  'Cortina', 'Camiseta', 'Relógio', 'Mochila', 'Carteira', 'Escova',
  'Vassoura', 'Cabide', 'Caneca', 'Toalha', 'Garrafa', 'Tomada', 'Lâmpada',
  'Maçaneta', 'Tapete', 'Almofada', 'Panela', 'Pincel', 'Tesoura', 'Martelo',
  'Chave', 'Vela', 'Bola', 'Pipa', 'Boneca', 'Tambor', 'Violão', 'Câmera',
  'Pulseira', 'Anel', 'Chapéu', 'Óculos', 'Cinto', 'Meia', 'Luva', 'Lenço',
  'Espada', 'Escudo', 'Foguete', 'Submarino', 'Trator', 'Caminhão', 'Trem',
  'Barco', 'Helicóptero', 'Patinete', 'Skate',
]
