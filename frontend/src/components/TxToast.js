import React from "react";

const TITLES = {
  wallet: "Confirme no MetaMask",
  mining: "Aguardando confirmação",
  success: "Pronto!",
  error: "Não foi possível concluir",
};

const ICONS = {
  wallet: "🦊",
  mining: null,
  success: "✅",
  error: "⛔",
};

// Aviso flutuante que acompanha cada transação, do MetaMask até a confirmação
export function TxToast({ tx, dismiss }) {
  if (!tx) return null;
  return (
    <div className={`tur-toast ${tx.stage}`} role="status" aria-live="polite">
      <div style={{ fontSize: "1.3rem", lineHeight: 1 }}>
        {tx.stage === "mining" ? (
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
        ) : (
          ICONS[tx.stage]
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="tur-toast-title">{TITLES[tx.stage]}</div>
        <div className="tur-toast-text">{tx.text}</div>
        {tx.hash && tx.stage === "mining" && (
          <div className="tur-toast-text mt-1" style={{ opacity: 0.75 }}>
            tx {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)}
          </div>
        )}
      </div>
      {(tx.stage === "error" || tx.stage === "success") && (
        <button type="button" className="close" aria-label="Fechar" onClick={dismiss}>
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  );
}
