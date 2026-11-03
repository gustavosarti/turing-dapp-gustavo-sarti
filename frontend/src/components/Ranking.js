import React from "react";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Ranking({ ranking, myCodinome, symbol }) {
  const top = ranking.length ? Number(ranking[0].balance) : 0;
  return (
    <div className="tur-card">
      <h5>Ranking</h5>
      <div className="tur-sub">Alunos ordenados por Turings recebidos. Atualiza em tempo real.</div>
      {ranking.length === 0 && <p className="text-muted mb-0">Nenhum aluno cadastrado.</p>}
      {ranking.map((r, i) => {
        const value = Number(r.balance);
        const pct = top > 0 ? (value / top) * 100 : 0;
        return (
          <div key={r.codinome} className={`tur-rank-row ${r.codinome === myCodinome ? "me" : ""}`}>
            <div className="tur-rank-pos">{value > 0 && i < 3 ? MEDALS[i] : i + 1}</div>
            <div className="flex-grow-1">
              <div className="tur-rank-name">
                {r.codinome}
                {r.codinome === myCodinome && <span className="text-primary small ml-2">(você)</span>}
              </div>
              <div className="tur-rank-bar">
                <div style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="tur-rank-value">
              {r.balance} <span className="text-muted small">{symbol}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
