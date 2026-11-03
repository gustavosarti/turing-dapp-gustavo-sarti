import React from "react";

export function Ranking({ ranking, myCodinome }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">Ranking</h5>
        <table className="table table-sm table-striped mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Codinome</th>
              <th className="text-right">Turings</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.codinome} className={r.codinome === myCodinome ? "table-primary" : ""}>
                <td>{i + 1}</td>
                <td>{r.codinome}</td>
                <td className="text-right">{r.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
