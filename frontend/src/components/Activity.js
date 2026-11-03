import React from "react";

const ICON = { vote: "🗳️", issue: "🪙", status: "⏯️" };

export function Activity({ items, symbol }) {
  return (
    <div className="tur-card">
      <h5>Atividade recente</h5>
      <div className="tur-sub">Eventos emitidos pelo contrato.</div>
      {items.length === 0 ? (
        <p className="text-muted mb-0">Nenhuma atividade ainda.</p>
      ) : (
        <ul className="tur-feed">
          {items.map((it) => (
            <li key={it.key}>
              <div className={`tur-feed-icon ${it.type}`}>{ICON[it.type]}</div>
              <div>
                {it.type === "vote" && (
                  <>
                    <b>{it.voter}</b> votou em <b>{it.target}</b> com {it.amount} {symbol}
                  </>
                )}
                {it.type === "issue" && (
                  <>
                    <b>{it.amount} {symbol}</b> emitidos para <b>{it.codinome}</b>
                  </>
                )}
                {it.type === "status" && <>Votação {it.active ? "reaberta" : "pausada"}</>}
                <div className="tur-feed-meta">bloco #{it.block}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
