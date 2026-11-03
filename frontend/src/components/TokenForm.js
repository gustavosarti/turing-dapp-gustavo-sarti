import React from "react";

// Formulário genérico: escolhe um codinome de aluno e uma quantidade de Turings.
// Usado tanto para vote() quanto para issueToken().
export class TokenForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { codinome: "", amount: "" };
  }

  render() {
    const { title, subtitle, buttonLabel, buttonClass, codinomes, unavailable, maxAmount, disabled, busy, symbol } =
      this.props;
    const blocked = unavailable || {};
    const amountNum = Number(this.state.amount);
    const amountInvalid =
      this.state.amount !== "" && (!(amountNum > 0) || (maxAmount !== undefined && amountNum > maxAmount));

    return (
      <div>
        <h5>{title}</h5>
        {subtitle && <div className="tur-sub">{subtitle}</div>}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!this.state.codinome || amountInvalid || this.state.amount === "") return;
            Promise.resolve(this.props.onSubmit(this.state.codinome, this.state.amount)).then((ok) => {
              if (ok) this.setState({ codinome: "", amount: "" }); // limpa após sucesso
            });
          }}
        >
          <div className="form-row">
            <div className="form-group col-sm-7">
              <label className="small font-weight-bold text-muted">CODINOME</label>
              <select
                className="form-control"
                value={this.state.codinome}
                onChange={(e) => this.setState({ codinome: e.target.value })}
                required
              >
                <option value="" disabled>
                  Selecione um aluno
                </option>
                {codinomes.map((c) => (
                  <option key={c} value={c} disabled={!!blocked[c]}>
                    {c}
                    {blocked[c] ? ` — ${blocked[c]}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group col-sm-5">
              <label className="small font-weight-bold text-muted">
                QUANTIDADE{maxAmount ? ` (máx. ${maxAmount})` : ""}
              </label>
              <div className="input-group">
                <input
                  className={`form-control ${amountInvalid ? "is-invalid" : ""}`}
                  type="number"
                  step="any"
                  min="0"
                  max={maxAmount}
                  value={this.state.amount}
                  onChange={(e) => this.setState({ amount: e.target.value })}
                  placeholder="1"
                  required
                />
                <div className="input-group-append">
                  <span className="input-group-text">{symbol}</span>
                </div>
              </div>
              {amountInvalid && (
                <small className="text-danger">
                  {maxAmount ? `Use um valor maior que 0 e até ${maxAmount}.` : "Use um valor maior que 0."}
                </small>
              )}
            </div>
          </div>
          <button className={`btn ${buttonClass || "btn-tur"}`} type="submit" disabled={disabled || busy}>
            {busy ? (
              <>
                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />
                Processando…
              </>
            ) : (
              buttonLabel
            )}
          </button>
        </form>
      </div>
    );
  }
}
