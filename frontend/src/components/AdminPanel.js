import React from "react";
import { TokenForm } from "./TokenForm";

export function AdminPanel({ voting, codinomes, issueToken, setVoting }) {
  return (
    <div className="card border-warning mb-3">
      <div className="card-header bg-warning">
        <b>Painel do superusuário</b>
      </div>
      <div className="card-body">
        <p>
          Votação:{" "}
          {voting ? (
            <span className="badge badge-success">ATIVA</span>
          ) : (
            <span className="badge badge-secondary">PAUSADA</span>
          )}
        </p>
        <button className="btn btn-success mr-2 mb-3" onClick={() => setVoting(true)} disabled={voting}>
          votingOn
        </button>
        <button className="btn btn-secondary mb-3" onClick={() => setVoting(false)} disabled={!voting}>
          votingOff
        </button>

        <TokenForm
          title="Emitir Turings (issueToken)"
          buttonLabel="issueToken"
          buttonClass="btn-warning"
          codinomes={codinomes}
          onSubmit={issueToken}
        />
      </div>
    </div>
  );
}
