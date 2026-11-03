# Turing dApp

Criptomoeda **Turing (TUR)** e dApp de votação dos projetos finais da disciplina de Blockchain (UFES).
Baseada no Hardhat Boilerplate (Atividade 12), rodando na blockchain local do Hardhat.

## Contrato (`contracts/Turing.sol`)

- **Uncapped Lazy Supply**: nenhum token é emitido no deploy; os Turings são criados sob demanda, sem limite máximo.
- **Controle de acesso**: `mapping(string => address) public users`, inicializado no construtor com a tabela exemplo.
- `owner` = conta que fez o deploy (conta #0 do `npx hardhat node`); `professora` = endereço da `roberta`.
- Turing tem 18 casas decimais (1 TUR = 10^18 unidades), então é possível votar com frações (ex.: 1.5).

| Função | Quem pode | O que faz |
|---|---|---|
| `updateUser(codinome, user_addr)` | owner/professora (modifier `onlyOwnerOrProfessora`) | Atualiza o endereço do codinome (codinome não pode ser vazio) |
| `votingOn()` / `votingOff()` | owner/professora | Ativa/pausa a votação (`voting` começa em `true`) |
| `issueToken(codinome, qtde)` | owner/professora | Cria (mint) `qtde` Turings para o codinome |
| `vote(codinome, qtde)` | usuários da tabela | Cria `qtde` Turings para o codinome votado. Requer: votação ativa, não votar em si mesmo, `0 < qtde <= 2 TUR`, um voto por codinome (`hasVote`). A cada 10 votos, o votante ganha 1 Turing. |

Funções de leitura extras: `balanceOf`, `totalSupply`, `codinomeOf(address)`, `getCodinomes()`, `votesCast(codinome)`.
Eventos: `Transfer`, `Voted`, `TokenIssued`, `VotingStatus`, `UserUpdated`.

## Frontend (`frontend/`)

- **Usuário comum**: formulário para votar (escolhe um aluno e a quantidade).
- **Superusuário** (owner ou professora): além do voto, painel com `issueToken`, `votingOn` e `votingOff`.
- Os campos de codinome listam só os alunos (a professora fica de fora; no voto, o próprio usuário também).
- **Ranking** por ordem de Turings: polling em `balanceOf()` a cada 2 s e atualização imediata ao receber os eventos `Voted`, `TokenIssued` e `VotingStatus`.

## Como rodar

```bash
npm install
npx hardhat test                                       # 8 testes

# Terminal 1 - blockchain local
npx hardhat node

# Terminal 2 - deploy (gera frontend/src/contracts/)
npx hardhat --network localhost run scripts/deploy.js

# Terminal 3 - frontend em http://localhost:3000
cd frontend
npm install
npm start
```

No MetaMask: rede `http://127.0.0.1:8545/`, ID da cadeia `31337`. Importe as chaves privadas das contas
mostradas pelo `npx hardhat node`:

| Conta Hardhat | Papel |
|---|---|
| #0 `0xf39F...2266` | owner (superusuário) |
| #1 a #5 | nome1 a nome5 (usuários comuns) |

A conta da professora (`roberta`, `0x5025...3Df7`) não é uma conta do Hardhat: ela usa a própria carteira.
Para testar como professora localmente, use `updateUser` ou personifique o endereço com `hardhat_impersonateAccount`.

> Se você reiniciar o `npx hardhat node`, refaça o deploy e, no MetaMask, limpe os dados da aba de atividades
> (Configurações > Avançado) para evitar erro de nonce.
