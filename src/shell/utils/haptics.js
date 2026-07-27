// Vibração como SINAL, não como ruído — UserInterface.md §3.5.
// Padrões calibrados para motores de celular real: abaixo de ~40ms a maioria
// dos Samsungs mal registra. Nada de vibrar em todo toque — só momentos-chave.
// Android/Chrome apenas; iOS web não vibra (no-op silencioso).

const vibrate = (pattern) => {
  try { navigator.vibrate?.(pattern) } catch { /* sem suporte */ }
}

export const haptics = {
  hit:      () => vibrate(45),                       // acertou uma palavra
  warn:     () => vibrate(80),                       // cada segundo da faixa vermelha
  timeUp:   () => vibrate([140, 80, 180]),           // o tempo estourou
  land:     () => vibrate(70),                       // roleta pousou
  step:     () => vibrate(45),                       // etapa do pódio subiu
  win:      () => vibrate([90, 60, 90, 60, 220]),    // campeão revelado
  attention:() => vibrate(60),                       // "cadê você?" (inação)
}
