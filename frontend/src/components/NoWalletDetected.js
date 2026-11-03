import React from "react";

export function NoWalletDetected() {
  return (
    <div className="tur-hero">
      <div className="tur-hero-card text-center">
        <div className="tur-logo mx-auto">T</div>
        <h4 className="font-weight-bold">Nenhuma carteira encontrada</h4>
        <p className="text-muted">
          Para usar a Turing dApp, instale a extensão{" "}
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
            MetaMask
          </a>{" "}
          no navegador e recarregue a página.
        </p>
      </div>
    </div>
  );
}
