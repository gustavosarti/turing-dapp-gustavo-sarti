import React from "react";

export function ConnectWallet({ connectWallet, connecting, networkError, dismiss }) {
  return (
    <div className="tur-hero">
      <div className="tur-hero-card">
        <div className="tur-logo">T</div>
        <h3 className="font-weight-bold mb-1">Turing dApp</h3>
        <p className="text-muted mb-0">
          Votação dos projetos finais com a criptomoeda <b>Turing (TUR)</b>.
        </p>

        <ol className="tur-steps">
          <li>
            Deixe a blockchain local rodando: <code className="tur-code">npx hardhat node</code>
          </li>
          <li>
            Publique o contrato: <code className="tur-code">npx hardhat --network localhost run scripts/deploy.js</code>
          </li>
          <li>No MetaMask, selecione uma conta cadastrada (ou a conta de deploy, para administrar).</li>
        </ol>

        {networkError && (
          <div className="tur-error" role="alert">
            <span>⚠️</span>
            <span>{networkError}</span>
            <button type="button" className="close" aria-label="Fechar" onClick={dismiss}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        )}

        <button
          className="btn btn-tur btn-block py-2"
          type="button"
          onClick={connectWallet}
          disabled={connecting}
        >
          {connecting ? (
            <>
              <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
              Aguardando o MetaMask…
            </>
          ) : (
            "Conectar carteira"
          )}
        </button>

        {connecting && (
          <div className="tur-hint">
            🦊 <b>Abra o MetaMask</b> (ícone da raposa na barra do navegador) e aprove a conexão
            com este site. Se ele pedir, aceite também trocar para a rede <b>Hardhat Local</b>.
          </div>
        )}
      </div>
    </div>
  );
}
