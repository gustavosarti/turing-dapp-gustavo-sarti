import React from "react";

// Formulário genérico: escolhe um codinome de aluno e uma quantidade de Turings.
// Usado tanto para vote() quanto para issueToken().
export function TokenForm({ title, buttonLabel, buttonClass, codinomes, maxAmount, onSubmit, disabled }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const codinome = formData.get("codinome");
            const amount = formData.get("amount");
            if (codinome && amount) {
              onSubmit(codinome, amount);
            }
          }}
        >
          <div className="form-group">
            <label>Codinome</label>
            <select className="form-control" name="codinome" required defaultValue="">
              <option value="" disabled>
                Selecione um aluno
              </option>
              {codinomes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantidade de Turings{maxAmount ? ` (máx. ${maxAmount})` : ""}</label>
            <input
              className="form-control"
              type="number"
              step="any"
              min="0"
              max={maxAmount}
              name="amount"
              placeholder="1"
              required
            />
          </div>
          <input
            className={`btn ${buttonClass || "btn-primary"}`}
            type="submit"
            value={buttonLabel}
            disabled={disabled}
          />
        </form>
      </div>
    </div>
  );
}
