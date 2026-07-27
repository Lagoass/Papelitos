# Papelito — Regras do Jogo

> Visão do JOGADOR. A versão curta exibida no app (`data/rules.js`) é derivada deste
> documento — este é a fonte da verdade das regras. Detalhes técnicos: `../specs/papelito.md`.

---

## 1. O que é o Papelito

Jogo de festa presencial em estilo *pass-and-play* — um único celular passa entre os
jogadores. De **2 a 4 times** se alternam em turnos cronometrados tentando adivinhar
palavras secretas.

O diferencial: as mesmas palavras retornam em **4 rodadas**, cada uma com regras de
comunicação mais restritivas. Na Rodada 1 todos aprendem as palavras juntos; nas seguintes,
essa memória coletiva é explorada com restrições crescentes — é aí que mora a graça.

## 2. Jogadores e Times

- **2, 3 ou 4 times**, com no mínimo **2 jogadores por time**. Sem máximo de jogadores.
- Times de tamanhos diferentes são permitidos — quem decide a divisão é o grupo. Jogadores
  de times menores seguram o celular mais vezes; consequência da escolha do grupo, não
  falha do jogo.
- Cada jogador escolhe seu time na sua vez de inserir palavras. A quantidade de jogadores é
  descoberta organicamente: jogou quem passou pelo celular no setup.
- Cada jogador recebe automaticamente uma **cor** única (por ordem de entrada). Durante o
  jogo, cada palavra aparece na cor de quem a criou.
- Times são identificados por **símbolos**: ■ ● ▲ ★.

## 3. Preparação (Setup)

O grupo define **tempo por turno** (segundos) e o modo:

- **Modo Normal:** o grupo define quantas palavras por jogador; cada um insere palavras
  livres.
- **Modo Temático:** o grupo cria temas (ex: *"uma profissão"*, *"um filme"*); cada jogador
  insere uma palavra por tema. A quantidade de temas define a de palavras. **Os temas ficam
  secretos durante as rodadas** — não aparecem para quem dá as dicas.

Na sua vez, o jogador: escolhe o time → dá seu nome (opcional) → preenche TODAS as palavras
→ confirma. **A confirmação é irreversível** — a tela seguinte esconde tudo para o próximo
jogador não ver. Quando todos inseriram, qualquer um aperta "Iniciar Jogo" e o pool de
palavras é travado até o fim da partida.

## 4. Quem começa — a roleta

Uma **roleta** sorteia o time que abre a partida **e a ordem cíclica completa** dos times
(ex: ▲ → ■ → ●). A partir daí:

- Dentro da rodada, os times se alternam turno a turno seguindo essa ordem.
- A cada nova rodada, abre o **próximo time da ordem** após quem abriu a anterior — em 4
  rodadas com 4 times, cada time abre exatamente uma.

## 5. Quem segura o celular — rotação justa

Dentro de cada time, o próximo a dar dicas é sempre **quem jogou menos vezes** até ali
(empate: quem está há mais tempo sem jogar). Isso vale a partida inteira, atravessando
rodadas — ninguém fica de fora e ninguém monopoliza o celular. A escolha considera só a
contagem de vezes, nunca o desempenho: craque e iniciante recebem as mesmas oportunidades.

## 6. O turno

Quem está com o celular vê a palavra (o time NÃO vê a tela) e tenta fazer o próprio time
adivinhar dentro do tempo:

- ✅ **Acertou:** +1 ponto para o time; a palavra sai da fila; vem a próxima.
- ⏭️ **Pular:** a palavra vai para o fim da fila. **Sem limite de pulos** — palavras
  difíceis se acumulam no fim da rodada e criam tensão, de propósito.
- ↩️ **Voltar:** desfaz o último pulo do turno atual.
- ⏱️ **Tempo esgotado:** o turno acaba na hora; a palavra da tela e as restantes voltam ao
  pool, **reembaralhadas** para o próximo time (como misturar os papeizinhos no pote).

O cronômetro **sempre reinicia cheio** a cada turno — tempo não acumula nem transfere.

## 7. As 4 Rodadas

Quando todas as palavras são adivinhadas, a rodada termina. O pool volta INTEIRO,
reembaralhado, sob a regra da próxima rodada:

| | Rodada | Pode | Proibido |
|---|---|---|---|
| 🗣️ | **1 — Livre** | Qualquer descrição, histórias, sinônimos | Dizer a palavra, traduções ou derivações |
| ☝️ | **2 — Uma Palavra** | Exatamente UMA palavra de dica | Mais de uma palavra; gestos; sons |
| 🤹 | **3 — Mímica** | Gestos, expressões, apontar | Qualquer som; palavras escritas |
| 🔊 | **4 — Som** | Barulhos, melodias, onomatopeias | Palavras; gestos explicativos |

> **Convenção da Rodada 4:** é quase impossível fazer sons sem gesticular. A prática
> recomendada é o time **não olhar** para quem dá a dica — convenção do grupo, não regra
> do app.

Se a rodada terminar no meio de um turno, o cronômetro para e a próxima rodada começa com
turno novo e tempo cheio.

## 8. Pontuação e Vitória

- Cada acerto = **1 ponto**, acumulado nas 4 rodadas numa contagem única por time.
- Vence o **time com mais pontos** ao fim da Rodada 4.
- **Empate no topo:** os times empatados (e só eles) disputam uma rodada extra com o pool
  completo. O formato é sorteado pela roleta ou escolhido pelo grupo; quem abre é sorteado.
  O grupo também pode simplesmente aceitar o empate.

## 9. Partida salva

A partida em andamento é salva automaticamente a cada ação. Fechou o app, travou o celular,
acabou a bateria? Ao reabrir, o card **"Continuar partida"** na home retoma do ponto exato.
Ao terminar (vitória ou empate aceito), o save é apagado — cada partida é uma folha em
branco.
