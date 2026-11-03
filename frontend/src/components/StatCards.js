import React from "react";

export function StatCards({ balance, totalSupply, voting, votesCast, isRegistered, symbol }) {
  const toReward = 10 - (votesCast % 10);
  return (
    <div className="row mb-2">
      <div className="col-6 col-lg-3 mb-3">
        <div className="tur-stat">
          <div className="tur-stat-label">Seu saldo</div>
          <div className="tur-stat-value">
            {balance} <small>{symbol}</small>
          </div>
        </div>
      </div>
      <div className="col-6 col-lg-3 mb-3">
        <div className="tur-stat">
          <div className="tur-stat-label">Total emitido</div>
          <div className="tur-stat-value">
            {totalSupply} <small>{symbol}</small>
          </div>
          <div className="tur-stat-hint">Sem limite máximo (lazy supply)</div>
        </div>
      </div>
      <div className="col-6 col-lg-3 mb-3">
        <div className="tur-stat">
          <div className="tur-stat-label">Votação</div>
          <div className="tur-stat-value">
            <span className={voting ? "tur-badge-on" : "tur-badge-off"}>{voting ? "ATIVA" : "PAUSADA"}</span>
          </div>
          <div className="tur-stat-hint">{voting ? "Votos liberados" : "Aguarde a reabertura"}</div>
        </div>
      </div>
      <div className="col-6 col-lg-3 mb-3">
        <div className="tur-stat">
          <div className="tur-stat-label">Seus votos</div>
          {isRegistered ? (
            <>
              <div className="tur-stat-value">{votesCast}</div>
              <div className="tur-mini-bar">
                <div style={{ width: `${((votesCast % 10) / 10) * 100}%` }} />
              </div>
              <div className="tur-stat-hint">
                Faltam {toReward} voto{toReward > 1 ? "s" : ""} para ganhar +1 {symbol}
              </div>
            </>
          ) : (
            <>
              <div className="tur-stat-value">—</div>
              <div className="tur-stat-hint">Conta fora da tabela de votantes</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
