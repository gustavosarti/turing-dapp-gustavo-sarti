import React from "react";

export function Loading({ message }) {
  return (
    <div className="tur-hero">
      <div className="tur-hero-card text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="sr-only">Carregando…</span>
        </div>
        <p className="mb-0 text-muted">{message || "Carregando dados do contrato…"}</p>
      </div>
    </div>
  );
}
