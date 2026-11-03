import React from "react";

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export function Header({ address, codinome, isSuperUser }) {
  return (
    <div className="tur-topbar">
      <div className="container d-flex flex-wrap align-items-center justify-content-between" style={{ gap: 10 }}>
        <div className="tur-brand">
          <div className="tur-logo">T</div>
          <div>
            Turing dApp
            <small>Votação dos projetos finais</small>
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center" style={{ gap: 8 }}>
          <span className="tur-pill">
            <span className="tur-dot" /> Hardhat Local · 31337
          </span>
          <span className="tur-pill" title={address}>
            👤 {codinome || "não cadastrado"} · {short(address)}
          </span>
          {isSuperUser && <span className="tur-role">superusuário</span>}
        </div>
      </div>
    </div>
  );
}
