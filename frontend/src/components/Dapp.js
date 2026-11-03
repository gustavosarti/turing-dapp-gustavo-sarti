import React from "react";
import { ethers } from "ethers";

// Artefatos gerados pelo scripts/deploy.js
import TuringArtifact from "../contracts/Turing.json";
import contractAddress from "../contracts/contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Header } from "./Header";
import { StatCards } from "./StatCards";
import { TokenForm } from "./TokenForm";
import { AdminPanel } from "./AdminPanel";
import { Ranking } from "./Ranking";
import { Activity } from "./Activity";
import { TxToast } from "./TxToast";

// Rede local do Hardhat
const HARDHAT_NETWORK_ID = "31337";

// Usuário cancelou no MetaMask
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// Turing tem 18 casas decimais (como o ETH)
const toUnits = (amount) => ethers.utils.parseUnits(String(amount), 18);
const fromUnits = (value) => {
  const s = ethers.utils.formatUnits(value, 18);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
};

// Mensagens dos require() do contrato em linguagem mais amigável
const FRIENDLY_ERRORS = {
  "Apenas owner ou professora": "Apenas o owner ou a professora podem fazer isso.",
  "Codinome vazio": "O codinome não pode ser vazio.",
  "Codinome nao cadastrado": "Esse codinome não está cadastrado.",
  "Votacao pausada": "A votação está pausada no momento.",
  "Usuario nao autorizado": "Sua conta não está na lista de votantes.",
  "Nao pode votar em si mesmo": "Você não pode votar em si mesmo.",
  "Quantidade deve ser > 0 e <= 2 Turings": "A quantidade deve ser maior que 0 e no máximo 2 Turings.",
  "Ja votou nesse codinome": "Você já votou nesse aluno.",
};

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      tokenData: undefined,
      selectedAddress: undefined,
      balance: undefined,
      totalSupply: undefined,
      myCodinome: undefined, // "" se o endereço não estiver cadastrado
      isSuperUser: false,
      voting: undefined,
      votesCast: 0,
      alreadyVoted: {}, // codinome -> true se o usuário já votou nele
      studentCodinomes: [], // todos os codinomes, exceto a professora
      ranking: [],
      activity: [],
      connecting: false,
      tx: undefined, // { stage: wallet | mining | success | error, text, hash }
      networkError: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          connecting={this.state.connecting}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (!this.state.tokenData || this.state.balance === undefined || this.state.myCodinome === undefined) {
      return <Loading />;
    }

    const { myCodinome, isSuperUser, voting, studentCodinomes, alreadyVoted, tx } = this.state;
    const symbol = this.state.tokenData.symbol;
    const isRegistered = myCodinome !== "";
    const busy = !!tx && (tx.stage === "wallet" || tx.stage === "mining");

    // No voto: o próprio usuário sai da lista e quem já recebeu voto fica desabilitado
    const voteOptions = studentCodinomes.filter((c) => c !== myCodinome);
    const unavailable = {};
    voteOptions.forEach((c) => {
      if (alreadyVoted[c]) unavailable[c] = "já votado";
    });

    return (
      <>
        <Header address={this.state.selectedAddress} codinome={myCodinome} isSuperUser={isSuperUser} />

        <div className="container py-4">
          <StatCards
            balance={fromUnits(this.state.balance)}
            totalSupply={fromUnits(this.state.totalSupply)}
            voting={voting}
            votesCast={this.state.votesCast}
            isRegistered={isRegistered}
            symbol={symbol}
          />

          <div className="row">
            <div className="col-lg-6">
              {!isRegistered && !isSuperUser && (
                <div className="tur-card">
                  <h5>Conta não autorizada</h5>
                  <p className="text-muted mb-0">
                    Este endereço não está na tabela de usuários do contrato Turing. Troque para uma conta
                    cadastrada no MetaMask para votar.
                  </p>
                </div>
              )}

              {isRegistered && (
                <div className="tur-card">
                  <TokenForm
                    title="Votar"
                    subtitle={
                      voting
                        ? "Escolha um colega e quantos Turings dar (até 2). Cada aluno só pode receber um voto seu."
                        : "A votação está pausada. Aguarde um superusuário reabrir."
                    }
                    buttonLabel="Votar"
                    codinomes={voteOptions}
                    unavailable={unavailable}
                    maxAmount={2}
                    disabled={!voting}
                    busy={busy}
                    symbol={symbol}
                    onSubmit={(codinome, amount) => this._vote(codinome, amount)}
                  />
                </div>
              )}

              {isSuperUser && (
                <AdminPanel
                  voting={voting}
                  codinomes={studentCodinomes}
                  busy={busy}
                  symbol={symbol}
                  issueToken={(codinome, amount) => this._issueToken(codinome, amount)}
                  setVoting={(on) => this._setVoting(on)}
                />
              )}

              <Activity items={this.state.activity} symbol={symbol} />
            </div>

            <div className="col-lg-6">
              <Ranking ranking={this.state.ranking} myCodinome={myCodinome} symbol={symbol} />
            </div>
          </div>

          <div className="tur-footer">
            Contrato Turing: {contractAddress.Turing} · rede local Hardhat (chainId {HARDHAT_NETWORK_ID})
          </div>
        </div>

        <TxToast tx={tx} dismiss={() => this._dismissTx()} />
      </>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
    this._stopListeningEvents();
    clearTimeout(this._toastTimer);
  }

  // ---------------- Conexão ----------------

  async _connectWallet() {
    try {
      this.setState({ connecting: true, networkError: undefined });

      // 1) Pede acesso às contas do MetaMask
      const [selectedAddress] = await window.ethereum.request({ method: "eth_requestAccounts" });

      // 2) Garante que o MetaMask está na rede local do Hardhat (cadastra se precisar)
      await this._ensureHardhatNetwork();

      await this._initialize(selectedAddress);

      if (!this._listeningAccounts) {
        this._listeningAccounts = true;
        window.ethereum.on("accountsChanged", ([newAddress]) => {
          this._stopPollingData();
          this._stopListeningEvents();
          if (newAddress === undefined) {
            return this._resetState();
          }
          this.setState({ myCodinome: undefined, balance: undefined, alreadyVoted: {} });
          this._initialize(newAddress);
        });
        window.ethereum.on("chainChanged", () => window.location.reload());
      }
    } catch (error) {
      console.error(error);
      let msg = error?.message || String(error);
      if (error?.code === -32002) {
        msg = "Já existe um pedido aberto no MetaMask. Clique no ícone da raposa e aprove (ou rejeite) o pedido.";
      } else if (error?.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        msg = "Você recusou a conexão no MetaMask.";
      }
      this.setState({ networkError: msg });
    } finally {
      this.setState({ connecting: false });
    }
  }

  async _ensureHardhatNetwork() {
    const chainIdHex = "0x" + Number(HARDHAT_NETWORK_ID).toString(16); // 0x7a69
    const current = await window.ethereum.request({ method: "eth_chainId" });
    if (current === chainIdHex) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (error) {
      // 4902 = rede ainda não cadastrada no MetaMask: cadastra
      if (error?.code === 4902 || error?.data?.originalError?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: "Hardhat Local",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else {
        throw error;
      }
    }
  }

  async _initialize(userAddress) {
    this._initializeEthers();
    try {
      const code = await this._provider.getCode(contractAddress.Turing);
      if (code === "0x") {
        throw new Error(
          "Contrato Turing não encontrado nesta rede. Rode o deploy: npx hardhat --network localhost run scripts/deploy.js"
        );
      }
      this.setState({ selectedAddress: userAddress });
      await this._getTokenData();
      await this._loadUsers(userAddress);
      await this._updateData();
      await this._loadActivity();
      this._startPollingData();
      this._listenEvents();
    } catch (error) {
      console.error(error);
      this.setState({ ...this.initialState, networkError: error.message || String(error) });
    }
  }

  _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    this._turing = new ethers.Contract(contractAddress.Turing, TuringArtifact.abi, this._provider.getSigner(0));
  }

  async _getTokenData() {
    const [name, symbol] = await Promise.all([this._turing.name(), this._turing.symbol()]);
    this.setState({ tokenData: { name, symbol } });
  }

  // Descobre o codinome do usuário, se ele é superusuário e a lista de alunos
  async _loadUsers(userAddress) {
    const [myCodinome, owner, professora, codinomes] = await Promise.all([
      this._turing.codinomeOf(userAddress),
      this._turing.owner(),
      this._turing.professora(),
      this._turing.getCodinomes(),
    ]);
    const addr = userAddress.toLowerCase();
    const isSuperUser = addr === owner.toLowerCase() || addr === professora.toLowerCase();
    const profCodinome = await this._turing.codinomeOf(professora);
    const studentCodinomes = codinomes.filter((c) => c !== profCodinome);

    this.setState({ myCodinome, isSuperUser, studentCodinomes });
  }

  // ---------------- Leitura periódica + eventos ----------------

  // Ranking "braçal": consulta balanceOf() de cada aluno periodicamente
  _startPollingData() {
    this._stopPollingData();
    this._pollDataInterval = setInterval(() => this._updateData(), 2000);
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // Além do polling, os eventos do contrato atualizam a tela na hora
  _listenEvents() {
    this._stopListeningEvents();
    this._onContractEvent = () => {
      this._updateData();
      this._loadActivity();
    };
    this._turing.on("Voted", this._onContractEvent);
    this._turing.on("TokenIssued", this._onContractEvent);
    this._turing.on("VotingStatus", this._onContractEvent);
  }

  _stopListeningEvents() {
    if (this._turing && this._onContractEvent) {
      this._turing.off("Voted", this._onContractEvent);
      this._turing.off("TokenIssued", this._onContractEvent);
      this._turing.off("VotingStatus", this._onContractEvent);
    }
  }

  async _updateData() {
    try {
      const me = this.state.myCodinome;
      const [balance, totalSupply, voting, votesCast] = await Promise.all([
        this._turing.balanceOf(this.state.selectedAddress),
        this._turing.totalSupply(),
        this._turing.voting(),
        me ? this._turing.votesCast(me) : Promise.resolve(ethers.BigNumber.from(0)),
      ]);

      const rows = await Promise.all(
        this.state.studentCodinomes.map(async (codinome) => {
          const addr = await this._turing.users(codinome);
          const [bal, voted] = await Promise.all([
            this._turing.balanceOf(addr),
            me ? this._turing.hasVote(me, codinome) : Promise.resolve(false),
          ]);
          return { codinome, raw: bal, balance: fromUnits(bal), voted };
        })
      );

      const alreadyVoted = {};
      rows.forEach((r) => {
        if (r.voted) alreadyVoted[r.codinome] = true;
      });
      rows.sort((a, b) => (b.raw.gt(a.raw) ? 1 : b.raw.lt(a.raw) ? -1 : a.codinome.localeCompare(b.codinome)));

      this.setState({
        balance,
        totalSupply,
        voting,
        votesCast: votesCast.toNumber(),
        alreadyVoted,
        ranking: rows,
      });
    } catch (error) {
      console.error(error);
    }
  }

  // Histórico a partir dos eventos já emitidos pelo contrato
  async _loadActivity() {
    try {
      const [votes, issues, statuses] = await Promise.all([
        this._turing.queryFilter(this._turing.filters.Voted(), 0),
        this._turing.queryFilter(this._turing.filters.TokenIssued(), 0),
        this._turing.queryFilter(this._turing.filters.VotingStatus(), 0),
      ]);
      const toItem = (type) => (e) => ({
        key: `${e.transactionHash}-${e.logIndex}`,
        type,
        block: e.blockNumber,
        logIndex: e.logIndex,
        voter: e.args.voter,
        target: e.args.target,
        codinome: e.args.codinome,
        amount: e.args.amount ? fromUnits(e.args.amount) : undefined,
        active: e.args.active,
      });
      const items = [...votes.map(toItem("vote")), ...issues.map(toItem("issue")), ...statuses.map(toItem("status"))]
        .sort((a, b) => b.block - a.block || b.logIndex - a.logIndex)
        .slice(0, 20);
      this.setState({ activity: items });
    } catch (error) {
      console.error(error);
    }
  }

  // ---------------- Transações ----------------

  async _vote(codinome, amount) {
    return this._sendTx(
      () => this._turing.vote(codinome, toUnits(amount)),
      `Votar em ${codinome} com ${amount} TUR`,
      `Voto registrado: ${amount} TUR para ${codinome}.`
    );
  }

  async _issueToken(codinome, amount) {
    return this._sendTx(
      () => this._turing.issueToken(codinome, toUnits(amount)),
      `Emitir ${amount} TUR para ${codinome}`,
      `${amount} TUR emitidos para ${codinome}.`
    );
  }

  async _setVoting(on) {
    return this._sendTx(
      () => (on ? this._turing.votingOn() : this._turing.votingOff()),
      on ? "Reabrir a votação" : "Pausar a votação",
      on ? "Votação reaberta." : "Votação pausada."
    );
  }

  // Envia uma transação mostrando cada etapa: MetaMask -> mineração -> resultado
  async _sendTx(sendFn, actionText, successText) {
    clearTimeout(this._toastTimer);
    try {
      this.setState({
        tx: { stage: "wallet", text: `${actionText}. Abra o MetaMask e clique em Confirmar.` },
      });
      const tx = await sendFn();
      this.setState({ tx: { stage: "mining", text: "Transação enviada. Aguardando a blockchain…", hash: tx.hash } });
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this._updateData();
      await this._loadActivity();
      this.setState({ tx: { stage: "success", text: successText } });
      this._toastTimer = setTimeout(() => this._dismissTx(), 5000);
      return true;
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER || error.code === "ACTION_REJECTED") {
        this.setState({ tx: { stage: "error", text: "Você cancelou a transação no MetaMask." } });
        this._toastTimer = setTimeout(() => this._dismissTx(), 5000);
        return false;
      }
      console.error(error);
      this.setState({ tx: { stage: "error", text: this._getRpcErrorMessage(error) } });
      return false;
    }
  }

  _dismissTx() {
    this.setState({ tx: undefined });
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // Extrai a mensagem do require() que falhou
  _getRpcErrorMessage(error) {
    const msg =
      error?.error?.data?.message ||
      error?.data?.message ||
      error?.error?.message ||
      error?.reason ||
      error?.message ||
      String(error);
    const match = msg.match(/reverted with reason string '([^']*)'/);
    const reason = match ? match[1] : msg;
    return FRIENDLY_ERRORS[reason] || reason.substring(0, 160);
  }

  _resetState() {
    this.setState(this.initialState);
  }
}
