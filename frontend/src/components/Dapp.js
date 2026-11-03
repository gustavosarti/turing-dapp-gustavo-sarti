import React from "react";
import { ethers } from "ethers";

// Artefatos gerados pelo scripts/deploy.js
import TuringArtifact from "../contracts/Turing.json";
import contractAddress from "../contracts/contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { TokenForm } from "./TokenForm";
import { AdminPanel } from "./AdminPanel";
import { Ranking } from "./Ranking";

// Rede local do Hardhat
const HARDHAT_NETWORK_ID = "31337";

// Usuário cancelou a transação no MetaMask
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// Turing tem 18 casas decimais (como o ETH)
const toUnits = (amount) => ethers.utils.parseUnits(String(amount), 18);
const fromUnits = (value) => {
  const s = ethers.utils.formatUnits(value, 18);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
};

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      tokenData: undefined,
      selectedAddress: undefined,
      balance: undefined,
      myCodinome: undefined, // "" se o endereço não estiver cadastrado
      isSuperUser: false,
      voting: undefined,
      studentCodinomes: [], // todos os codinomes, exceto a professora
      ranking: [],
      txBeingSent: undefined,
      transactionError: undefined,
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
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (!this.state.tokenData || this.state.balance === undefined || this.state.myCodinome === undefined) {
      return <Loading />;
    }

    const { myCodinome, isSuperUser, voting, studentCodinomes } = this.state;
    const isRegistered = myCodinome !== "";
    // No voto, o usuário não pode escolher a si mesmo
    const voteOptions = studentCodinomes.filter((c) => c !== myCodinome);

    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              {this.state.tokenData.name} ({this.state.tokenData.symbol})
            </h1>
            <p className="mb-1">
              Conta: <b>{this.state.selectedAddress}</b>
            </p>
            <p className="mb-1">
              Codinome: <b>{isRegistered ? myCodinome : "não cadastrado"}</b>{" "}
              {isSuperUser && <span className="badge badge-warning">superusuário</span>}
            </p>
            <p>
              Saldo:{" "}
              <b>
                {fromUnits(this.state.balance)} {this.state.tokenData.symbol}
              </b>{" "}
              · Votação:{" "}
              {voting ? (
                <span className="badge badge-success">ATIVA</span>
              ) : (
                <span className="badge badge-secondary">PAUSADA</span>
              )}
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {this.state.txBeingSent && <WaitingForTransactionMessage txHash={this.state.txBeingSent} />}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            {!isRegistered && !isSuperUser && (
              <div className="alert alert-danger">
                Este endereço não está autorizado a usar o contrato Turing.
              </div>
            )}

            {isRegistered && (
              <TokenForm
                title="Votar (vote)"
                buttonLabel="Votar"
                codinomes={voteOptions}
                maxAmount={2}
                disabled={!voting}
                onSubmit={(codinome, amount) => this._vote(codinome, amount)}
              />
            )}
            {isRegistered && !voting && <p className="text-muted">A votação está pausada.</p>}

            {isSuperUser && (
              <AdminPanel
                voting={voting}
                codinomes={studentCodinomes}
                issueToken={(codinome, amount) => this._issueToken(codinome, amount)}
                setVoting={(on) => this._setVoting(on)}
              />
            )}
          </div>

          <div className="col-md-6">
            <Ranking ranking={this.state.ranking} myCodinome={myCodinome} />
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
    this._stopListeningEvents();
  }

  async _connectWallet() {
    try {
      this._dismissNetworkError();

      // 1) Pede acesso às contas do MetaMask
      const [selectedAddress] = await window.ethereum.request({ method: "eth_requestAccounts" });

      // 2) Garante que o MetaMask está na rede local do Hardhat (cadastra se precisar)
      await this._ensureHardhatNetwork();

      this._initialize(selectedAddress);

      if (!this._listeningAccounts) {
        this._listeningAccounts = true;
        window.ethereum.on("accountsChanged", ([newAddress]) => {
          this._stopPollingData();
          this._stopListeningEvents();
          if (newAddress === undefined) {
            return this._resetState();
          }
          this.setState({ myCodinome: undefined, balance: undefined });
          this._initialize(newAddress);
        });
        window.ethereum.on("chainChanged", () => window.location.reload());
      }
    } catch (error) {
      console.error(error);
      let msg = error?.message || String(error);
      if (error?.code === -32002) {
        msg = "Já existe um pedido de conexão aberto no MetaMask. Clique no ícone do MetaMask e aprove (ou rejeite) o pedido.";
      } else if (error?.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        msg = "Conexão recusada no MetaMask.";
      }
      this.setState({ networkError: msg });
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
    const name = await this._turing.name();
    const symbol = await this._turing.symbol();
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

  // Ranking "braçal": consulta balanceOf() de cada aluno periodicamente
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateData(), 2000);
    this._updateData();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // Além do polling, os eventos do contrato atualizam a tela na hora
  _listenEvents() {
    this._stopListeningEvents();
    this._onContractEvent = () => this._updateData();
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
      const [balance, voting] = await Promise.all([
        this._turing.balanceOf(this.state.selectedAddress),
        this._turing.voting(),
      ]);

      const rows = await Promise.all(
        this.state.studentCodinomes.map(async (codinome) => {
          const addr = await this._turing.users(codinome);
          const bal = await this._turing.balanceOf(addr);
          return { codinome, raw: bal, balance: fromUnits(bal) };
        })
      );
      rows.sort((a, b) => (b.raw.gt(a.raw) ? 1 : b.raw.lt(a.raw) ? -1 : a.codinome.localeCompare(b.codinome)));

      this.setState({ balance, voting, ranking: rows });
    } catch (error) {
      console.error(error);
    }
  }

  async _vote(codinome, amount) {
    await this._sendTx(() => this._turing.vote(codinome, toUnits(amount)));
  }

  async _issueToken(codinome, amount) {
    await this._sendTx(() => this._turing.issueToken(codinome, toUnits(amount)));
  }

  async _setVoting(on) {
    await this._sendTx(() => (on ? this._turing.votingOn() : this._turing.votingOff()));
  }

  // Envia uma transação e trata espera/erros
  async _sendTx(sendFn) {
    try {
      this._dismissTransactionError();
      const tx = await sendFn();
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this._updateData();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER || error.code === "ACTION_REJECTED") {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
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
    return match ? match[1] : msg;
  }

  _resetState() {
    this.setState(this.initialState);
  }
}
