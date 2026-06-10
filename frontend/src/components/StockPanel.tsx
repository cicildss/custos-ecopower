import { cost, money, quantity } from "../lib/format";
import type { ProductDetail } from "../types/api";

type StockPanelProps = {
  data: ProductDetail["sb2"];
};

export function StockPanel({ data }: StockPanelProps) {
  return (
    <section className="data-panel">
      <div className="data-panel-header">
        <div>
          <h2>Estoque e valor</h2>
          <p>Saldo por filial e armazém, com custo total e custo unitário calculado.</p>
        </div>
        <div className="data-panel-total">
          <span>Total consolidado</span>
          <strong>{money(data.total.custo_total)}</strong>
          <small>{quantity(data.total.quantidade)} un. | {cost(data.total.custo_unitario)} médio</small>
        </div>
      </div>

      <div className="stock-list">
        {data.rows.map((row, index) => (
          <article className="stock-row" key={`${row.b2_filial}-${row.b2_local}-${index}`}>
            <div>
              <span className="row-label">Filial</span>
              <strong>{row.b2_filial ?? "N/A"}</strong>
            </div>
            <div>
              <span className="row-label">Armazém</span>
              <strong>{row.b2_local ?? "N/A"}</strong>
              {row.b2_descricao && <small>{row.b2_descricao}</small>}
            </div>
            <div className="numeric">
              <span className="row-label">Quantidade</span>
              <strong>{quantity(row.b2_qatu)}</strong>
            </div>
            <div className="numeric">
              <span className="row-label">Custo total</span>
              <strong>{money(row.b2_cm1)}</strong>
            </div>
            <div className="numeric">
              <span className="row-label">Custo unitário</span>
              <strong>{cost(row.custo_unitario)}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
