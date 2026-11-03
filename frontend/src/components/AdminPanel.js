import React from "react";
import { TokenForm } from "./TokenForm";

export function AdminPanel({ voting, codinomes, issueToken, setVoting, busy, symbol }) {
  return (
    <div className="tur-card tur-card-admin">
      <h5>Painel do superusuário</h5>
      <div className="tur-sub">Disponível apenas para o owner e a professora.</div>

      <div className="d-flex flex-wrap align-items-center mb-4" style={{ gap: 10 }}>
        <span className="mr-1">Votação:</span>
        <span className={voting ? "tur-badge-on" : "tur-badge-off"}>{voting ? "ATIVA" : "PAUSADA"}</span>
        <div className="ml-auto">
          <button
            className="btn btn-outline-success btn-sm mr-2"
            onClick={() => setVoting(true)}
            disabled={voting || busy}
          >
            ▶ votingOn
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => setVoting(false)}
            disabled={!voting || busy}
          >
            ⏸ votingOff
          </button>
        </div>
      </div>

      <TokenForm
        title="Emitir Turings"
        subtitle="issueToken: cria novos Turings na carteira do aluno escolhido."
        buttonLabel="Emitir Turings"
        buttonClass="btn-tur-accent"
        codinomes={codinomes}
        busy={busy}
        symbol={symbol}
        onSubmit={issueToken}
      />
    </div>
  );
}
