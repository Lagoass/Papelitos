# Papelito — Regras Oficiais do Jogo

---

## 1. O que é o Papelito

Papelito é um jogo digital cooperativo e competitivo jogado **presencialmente** em estilo *pass-and-play*, com um único dispositivo compartilhado entre todos os jogadores. As equipes se alternam em turnos cronometrados tentando adivinhar palavras secretas.

A mecânica central do jogo é simples: fazer a própria equipe adivinhar um conjunto de palavras. A genialidade está na progressão — **as mesmas palavras retornam em 4 rodadas**, cada vez com regras de comunicação mais restritivas, tornando o jogo progressivamente mais desafiador e divertido.

---

## 2. Jogadores e Times

- **Mínimo:** 4 jogadores no total — 2 por time.
- **Máximo:** Sem limite definido. O jogo escala naturalmente com o tamanho do grupo.
- Os jogadores se dividem em exatamente **dois times: Time A e Time B**.
- Dentro de cada time, os membros se revezam para segurar o dispositivo a cada turno.
- **Times assimétricos são permitidos** — Time A pode ter 2 jogadores e Time B pode ter 3, por exemplo. A divisão fica a critério do grupo.

> **Regra de base:** Em cada turno, um jogador do time ativo segura o dispositivo e tenta fazer **pelo menos um outro membro do seu time** adivinhar as palavras. Por isso, o mínimo é 2 por time.

### 2.1 Quantidade de Jogadores

A quantidade total de jogadores **não é predefinida** antes da partida. Ela é descoberta organicamente: ao final da fase de inserção de palavras, o jogo conta quantos jogadores passaram pelo dispositivo e inseriram seu conjunto de palavras. Se 7 pessoas participaram da inserção, a partida terá 7 jogadores.

### 2.2 Cores dos Jogadores

Cada jogador recebe automaticamente uma cor única no momento em que passa pela inserção de palavras. A cor é atribuída por ordem de passagem — o primeiro jogador recebe a cor 1, o segundo a cor 2, e assim por diante — a partir de uma paleta fixa predefinida.

A cor de cada jogador aparece em dois momentos do jogo:

- **Durante a inserção de palavras:** O nome do jogador e elementos visuais da tela assumem sua cor, identificando visualmente de quem é a vez.
- **Durante o jogo:** A palavra exibida na tela aparece na cor do jogador que a criou, adicionando um elemento visual de identidade ao pool.

---

## 3. Configuração da Partida (Setup)

Antes de iniciar a primeira rodada, o grupo escolhe o **modo de jogo** e define os parâmetros de configuração por consenso. Os parâmetros variam conforme o modo escolhido.

Em ambos os modos, o **tempo de turno** é sempre definido pelo grupo (em segundos) e não possui valor fixo obrigatório.

### 3.1 Modos de Preparação do Pool de Palavras

#### Modo Normal (Jogo Rápido)
A abordagem tradicional. O grupo define a **quantidade de palavras por jogador** e o dispositivo passa de mão em mão. Cada jogador insere livremente suas palavras secretas até completar sua cota. Não há restrição temática.

| Parâmetro | Quem define |
|-----------|-------------|
| Número de palavras por jogador | Consenso do grupo |
| Tempo de turno | Consenso do grupo |

#### Modo Temático (Temas)
Traz uma camada criativa extra. Em vez de definir palavras por jogador diretamente, o grupo define os **temas** — e a quantidade de temas determina automaticamente a quantidade de palavras por jogador.

> **Regra:** Se o grupo criou 5 temas, cada jogador inserirá exatamente 5 palavras — uma para cada tema.

| Parâmetro | Quem define |
|-----------|-------------|
| Temas (categorias) | Consenso do grupo — ex: *"Uma profissão"*, *"Um lugar histórico"*, *"Um filme famoso"* |
| Número de palavras por jogador | Determinado automaticamente pela quantidade de temas |
| Tempo de turno | Consenso do grupo |

- **Inserção:** Em vez de palavras livres, cada jogador, na sua vez de setup, insere uma palavra que corresponda especificamente a cada um dos temas criados.
- **Ocultação durante o jogo:** Os temas orientam a criação das palavras e garantem um pool criativo e equilibrado, mas **permanecem em segredo durante as rodadas**. Eles não aparecem na tela de quem está dando a dica, impedindo que facilitem demais a adivinhação.

### 3.2 Inserção de Palavras e Alocação de Times

O dispositivo passa de mão em mão em qualquer ordem decidida pelo grupo. Quando um jogador recebe o dispositivo para inserir suas palavras, ele realiza três ações em sequência:

1. **Escolhe seu time** (Time A ou Time B) através de um botão na tela.
2. **Insere suas N palavras** — todos os campos são obrigatórios. Não é possível confirmar com campos vazios.
3. **Confirma e passa o dispositivo** para o próximo jogador.

> **Importante:** A confirmação das palavras é **irreversível**. Uma vez confirmado, o jogador não pode editar, remover ou adicionar palavras. A tela seguinte é uma tela de bloqueio que oculta tudo que foi digitado, garantindo que o próximo jogador não veja as palavras do anterior.

Quando todos os jogadores tiverem inserido suas palavras, o dispositivo retorna a qualquer jogador do grupo, que pressiona **"Iniciar Jogo"**.

### 3.3 Travamento do Pool

Assim que o botão "Iniciar Jogo" é pressionado e o primeiro turno começa, **o pool global de palavras é travado**. Nenhuma palavra nova pode ser adicionada e o estado inicial fica selado até o fim do jogo.

---

## 4. Início da Partida — Quem Começa o Round 1

O time que inicia o Round 1 é determinado por **sorteio aleatório** realizado pelo jogo no momento em que "Iniciar Jogo" é pressionado. O sorteio é apresentado como uma **animação de roleta**, criando suspense antes de revelar qual time abre a partida.

---

## 5. Ordem dos Turnos e Rotação de Jogadores

### 5.1 Alternância entre Times

A ordem de início de cada rodada alterna rigidamente entre os times:

| Rodada | Time que inicia |
|--------|----------------|
| Round 1 | Sorteado aleatoriamente |
| Round 2 | Time oposto ao do Round 1 |
| Round 3 | Mesmo time do Round 1 |
| Round 4 | Mesmo time do Round 2 |
| Desempate | Sorteado aleatoriamente |

Dentro de cada rodada, os times se alternam turno a turno: sempre que um time joga, o outro joga em seguida.

### 5.2 Rotação Interna dos Jogadores

Dentro de cada time, os jogadores se revezam em uma **fila circular contínua** que não reseta entre rodadas. A rotação continua de onde parou ao fim de cada turno, independentemente da fronteira de rodada.

**Exemplo com Time A tendo Jogador 1 e Jogador 2:**
```
Turno 1 do Time A → Jogador 1
Turno 2 do Time A → Jogador 2
Turno 3 do Time A → Jogador 1  ← reinicia a fila
Turno 4 do Time A → Jogador 2
... e assim sucessivamente, mesmo atravessando rodadas
```

### 5.3 O Caso da Justiça — Fronteiras de Rodada

Em partidas onde uma rodada termina no meio de um turno, pode surgir uma situação onde a rotação interna de um time e a alternância entre times parecem conflitar. Veja o caso abaixo:

**Cenário:**
- Time A: Jogador 1 e Jogador 2
- Time B: Jogador 3 e Jogador 4
- Pool com 20 palavras — Round 1 com Time A começando

```
Round 1:
  → Jogador 1 (Time A): acerta 7 palavras. Tempo esgota.
  → Jogador 3 (Time B): acerta as 13 palavras restantes. Rodada encerra.
```

O Jogador 2 do Time A não chegou a jogar no Round 1. Quem começa o Round 2?

**Resolução — a alternância entre times tem prioridade:**

O Time A começou o Round 1, portanto o **Time B começa o Round 2** — independentemente de quais jogadores individuais jogaram ou não. A unidade competitiva do jogo é o time, e a justiça é medida nessa escala.

A rotação interna de cada time continua de forma independente:

```
Round 2 — Time B começa:
  → Time B: Jogador 3 já jogou → próximo é o Jogador 4
  → Time A: Jogador 1 já jogou → próximo é o Jogador 2 (finalmente joga)
  → Time B: fila circular → Jogador 3 novamente
  ...
```

> **Nota sobre times assimétricos:** Em times de tamanhos diferentes, jogadores de times menores naturalmente acumularão mais turnos ao longo da partida. Isso é uma consequência direta da escolha do grupo ao se dividir de forma assimétrica, e não é considerado uma falha do jogo.

---

## 6. Dinâmica do Turno

A cada turno, um jogador do time ativo segura o dispositivo **para si, sem que sua equipe veja a tela**, e tenta fazer o time adivinhar a palavra exibida dentro do tempo limite.

O jogador possui três ações disponíveis:

### ✅ Acertar (Hit)
A equipe adivinhou a palavra corretamente.
- O time ativo **ganha 1 ponto**.
- A palavra é **removida da fila** da rodada atual.
- O jogo exibe a próxima palavra automaticamente.

### ⏭️ Pular (Skip)
A equipe empacou, não consegue adivinhar, ou o jogador não sabe como explicar.
- Nenhum ponto é contabilizado.
- A palavra vai para o **final da fila** da rodada atual — ela retornará mais tarde.
- O jogo exibe a próxima palavra imediatamente.
- **Não há limite de skips.** A mesma palavra pode ser pulada indefinidamente. Isso é intencional: palavras difíceis naturalmente acumulam-se ao final da fila, criando tensão orgânica no fim de cada rodada.

### ⏱️ Fim do Tempo (End Turn)
O cronômetro chega a zero no meio de uma tentativa.
- O turno encerra imediatamente; a tentativa em andamento é invalidada.
- A palavra que estava na tela, e todas as demais não adivinhadas naquele turno, **voltam para o pool da rodada**.
- As palavras restantes são **reembaralhadas aleatoriamente** para o próximo time, simulando a mistura física dos papéis.
- A pontuação do turno é consolidada e o dispositivo passa para o próximo jogador do time adversário.

### 🔄 Reset do Cronômetro

O cronômetro é **sempre reiniciado integralmente** no início de cada novo turno, independente do tempo que sobrou no turno anterior.

> **Exemplo:** Se o Time A terminou seu turno com 30 segundos sobrando, o próximo jogador do Time B começa com o tempo cheio novamente — não com os 30 segundos restantes. O tempo não acumula nem transfere entre turnos.

---

## 7. As Quatro Rodadas

O coração do Papelito é a progressão por 4 rodadas. Quando todas as palavras do pool são adivinhadas — pelo esforço conjunto dos dois times —, a rodada termina.

Nesse momento, **o jogo não gera palavras novas**. O pool original, com todas as palavras intactas, é **reembaralhado aleatoriamente** para evitar memorização de ordem. A partida continua de onde parou, mas sob a regra de comunicação da próxima rodada.

> A cada rodada, a equipe acumula memórias e associações das rodadas anteriores. Isso é parte essencial da mecânica — na Rodada 1, todos aprendem juntos. Nas rodadas seguintes, esse aprendizado é explorado com restrições crescentes.

---

### 🗣️ Rodada 1 — Livre

Comunicação sem restrições. O jogador pode usar quaisquer frases, contar histórias, dar descrições elaboradas, usar sinônimos ou antônimos.

**Proibido:**
- Dizer a própria palavra ou traduções dela.
- Dizer partes ou derivações da palavra (prefixos, sufixos, conjugações, etc.).

---

### ☝️ Rodada 2 — Uma Palavra

A comunicação afunila drasticamente. O jogador deve escolher e dizer **estritamente uma única palavra** como dica. A memória e as associações construídas na Rodada 1 entram fortemente em cena.

**Proibido:**
- Dizer mais de uma palavra.
- Usar gestos ou sons como complemento.

---

### 🤹 Rodada 3 — Mímica

Silêncio absoluto. A comunicação é exclusivamente corporal: gestos, expressões faciais, apontamentos e imitações.

**Proibido:**
- Emitir qualquer tipo de som com a boca.
- Usar palavras escritas ou sinalizadas.

---

### 🔊 Rodada 4 — Som

O extremo oposto da mímica. O jogador pode emitir barulhos, assobios, melodias murmuradas e onomatopeias.

**Proibido:**
- Usar palavras ou formar frases.
- Fazer gestos corporais explicativos.

> **Convenção social da Rodada 4:** Fazer sons sem gesticular involuntariamente é muito difícil. Por isso, a prática recomendada é que os membros da equipe **não olhem para o jogador** que está dando a dica. Isso não é uma regra técnica do jogo — é uma convenção moral do grupo para tornar a rodada mais justa e divertida.

---

## 8. Avanço de Rodada Durante um Turno

Se uma rodada termina enquanto o cronômetro de um jogador ainda está correndo, o cronômetro para imediatamente. A tela transita para a explicação das regras da nova rodada. No próximo clique, um novo turno começa integralmente com as novas diretrizes.

---

## 9. Pontuação

- Cada **acerto (Hit)** vale **1 ponto** para o time ativo no momento.
- Os pontos são acumulados ao longo de todas as quatro rodadas em uma única contagem por time.
- Palavras puladas ou não adivinhadas por fim de tempo **não geram pontos**.

---

## 10. Condição de Vitória e Fim de Jogo

O jogo encerra quando a última palavra da **Rodada 4 (Som)** é acertada e o pool se esvazia pela quarta e última vez.

O **time com maior pontuação acumulada** ao longo das quatro rodadas é declarado vencedor.

### Empate

Em caso de pontuações iguais ao final da Rodada 4, o resultado é um **empate**.

**Rodada de Desempate (opcional):** O grupo pode optar por jogar uma rodada extra com o pool completo de palavras reembaralhado. O time que inicia o desempate é sorteado aleatoriamente. O formato da rodada extra é decidido na hora, com duas opções:

- **Randomizar:** O jogo sorteia automaticamente um dos quatro formatos (Livre, Uma Palavra, Mímica ou Som).
- **Escolher:** O grupo decide em conjunto qual dos quatro formatos será jogado.

> Na prática, empates são raros. A rodada de desempate é uma hipótese opcional deixada à decisão do grupo.

---

## 11. Persistência de Partida

O estado completo da partida em andamento é salvo automaticamente a cada ação. Caso o dispositivo seja bloqueado, o app fechado acidentalmente ou a tela apague durante um turno, a partida pode ser retomada do ponto exato onde parou.

A persistência é válida apenas para a **partida em andamento**. Ao encerrar o jogo (vitória, empate ou desempate resolvido), o estado salvo é apagado. Resultados de partidas anteriores não são mantidos entre sessões.

---

## 12. Resumo Rápido das Regras

| Elemento | Regra |
|----------|-------|
| Times | 2 times — Time A e Time B |
| Total de jogadores | Mínimo 4, sem máximo, descoberto ao iniciar |
| Times assimétricos | Permitido |
| Alocação de time | Cada jogador escolhe seu time durante a inserção de palavras |
| Cores | Atribuídas automaticamente por ordem de inserção |
| Tempo de turno | Definido pelo grupo — sempre reiniciado integralmente a cada turno |
| Palavras por jogador (Modo Normal) | Definido pelo grupo antes de começar |
| Palavras por jogador (Modo Temático) | Determinado pela quantidade de temas criados |
| Palavras obrigatórias | Todos os campos devem ser preenchidos — sem exceção |
| Edição pós-confirmação | Não permitida |
| Acerto | +1 ponto, palavra sai da fila |
| Pular | 0 pontos, palavra vai pro fim da fila |
| Pulos por palavra | Sem limite |
| Fim do tempo | Palavras restantes voltam ao pool e são reembaralhadas |
| Quem começa Round 1 | Sorteado aleatoriamente — animação de roleta |
| Alternância de times | Rígida por rodada — se A começou R1, B começa R2 |
| Rotação interna | Fila circular contínua por time, não reseta entre rodadas |
| Progressão | 4 rodadas com o mesmo pool de palavras |
| Vitória | Time com mais pontos ao fim da Rodada 4 |
| Empate | Opcional: rodada extra — time sorteado, formato sorteado ou escolhido |
| Persistência | Apenas a partida em andamento — sem histórico entre sessões |