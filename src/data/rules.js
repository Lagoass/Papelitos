// Regras do Papelito — exibidas no SettingsScreen via accordion.
// Adaptado de rules.md para formato curto, focado em leitura mobile.

export const RULES = [
  {
    title: 'O que é o Papelito',
    body: 'Jogo de festa presencial em estilo pass-and-play — um único celular passa entre os jogadores. Dois ou mais times se alternam em turnos cronometrados tentando adivinhar palavras secretas. O diferencial: as mesmas palavras retornam em 4 rodadas, cada uma com regras de comunicação mais restritivas.',
  },
  {
    title: 'Jogadores e Times',
    body: 'Suporta 2, 3 ou 4 times, com no mínimo 2 jogadores por time. Não há máximo de jogadores. Times de tamanhos diferentes são permitidos — quem decide a divisão é o grupo. Cada jogador escolhe seu time durante a inserção de palavras.',
  },
  {
    title: 'Modo Normal vs Temático',
    body: 'Modo Normal: o grupo define quantas palavras por jogador, e cada um insere palavras livres. Modo Temático: o grupo define temas (ex: "uma profissão", "um filme") e cada jogador insere uma palavra para cada tema. A quantidade de temas determina o número de palavras. Os temas ficam ocultos durante as rodadas.',
  },
  {
    title: 'Dinâmica do Turno',
    body: '✅ Acertou: o time ganha 1 ponto e a palavra sai da fila.\n⏭️ Pular: a palavra vai para o final da fila — sem limite de skips.\n↩️ Voltar: desfaz o último pular do turno atual.\n⏱️ Fim do tempo: o turno encerra imediatamente; as palavras não adivinhadas voltam ao pool e são reembaralhadas para o próximo time.',
  },
  {
    title: 'As 4 Rodadas',
    body: '🗣️ Rodada 1 — Livre: qualquer descrição. Proibido dizer a palavra ou derivações.\n☝️ Rodada 2 — Uma Palavra: dica de exatamente uma palavra. Sem gestos ou sons.\n🤹 Rodada 3 — Mímica: apenas gestos e expressões. Sem sons.\n🔊 Rodada 4 — Som: apenas barulhos e onomatopeias. Sem palavras ou gestos.',
  },
  {
    title: 'Ordem dos Times',
    body: 'A roleta sorteia o primeiro time E a ordem cíclica completa da partida. A partir daí, os times se alternam turno a turno seguindo essa ordem. A cada nova rodada, quem abre é o próximo na ordem ciclicamente, garantindo que cada time tenha chance de abrir uma rodada.',
  },
  {
    title: 'Rotação de Jogadores',
    body: 'Dentro de cada time, os jogadores se revezam em uma fila circular contínua que nunca reseta. A rotação continua de onde parou ao fim de cada turno, mesmo entre rodadas. A alternância entre times tem prioridade sobre a rotação individual — o que importa é a justiça entre times.',
  },
  {
    title: 'Vitória e Empate',
    body: 'O time com mais pontos ao final da Rodada 4 vence. Se dois ou mais times empatarem no topo, há uma rodada extra de desempate — apenas os times empatados jogam. O formato pode ser sorteado pela roleta ou escolhido pelo grupo. Times não empatados assistem.',
  },
  {
    title: 'Persistência',
    body: 'A partida em andamento é salva automaticamente após cada ação. Se o app fechar ou o celular travar, você pode retomar do ponto exato ao reabrir. Resultados de partidas anteriores não são mantidos entre sessões — cada partida é uma nova folha em branco.',
  },
]
