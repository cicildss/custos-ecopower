import { ChevronLeft, ChevronRight } from "lucide-react";
import { cost, date, money, quantity } from "../lib/format";
import type { ProductDetail } from "../types/api";

type InvoicesTableProps = {
  data: ProductDetail["sd1"];
  onPageChange: (page: number) => void;
};

export function InvoicesTable({ data, onPageChange }: InvoicesTableProps) {
  const { page, totalPages, total } = data.pagination;

  return (
    <section className="data-panel">
      <div className="data-panel-header">
        <div>
          <h2>Notas fiscais de entrada</h2>
          <p>Entradas SD1 vinculadas ao produto, com fornecedor e custo calculado por item.</p>
        </div>
        <div className="pager">
          <button type="button" aria-label="Página anterior" title="Página anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span>{page} / {Math.max(totalPages, 1)} | {total} registros</span>
          <button type="button" aria-label="Próxima página" title="Próxima página" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="result-state">Nenhuma nota de entrada encontrada para este produto.</div>
      ) : (
        <div className="invoice-list">
          {data.rows.map((row, index) => (
            <article className="invoice-card" key={`${row.d1_doc}-${row.d1_serie}-${index}`}>
              <div className="invoice-main">
                <div>
                  <span className="row-label">NF / Série</span>
                  <strong>{row.d1_doc ?? "N/A"} / {row.d1_serie ?? "N/A"}</strong>
                </div>
                <div>
                  <span className="row-label">Fornecedor</span>
                  <strong>{row.fornecedor.nome ?? "Fornecedor não cadastrado"}</strong>
                  <small>{row.fornecedor.codigo ?? "N/A"} / {row.fornecedor.loja ?? "N/A"} | {row.fornecedor.cnpj ?? "CNPJ não informado"}</small>
                </div>
              </div>

              <div className="invoice-metrics">
                <div>
                  <span className="row-label">Emissão</span>
                  <strong>{date(row.d1_emissao)}</strong>
                </div>
                <div>
                  <span className="row-label">Entrada</span>
                  <strong>{date(row.d1_dtdigit)}</strong>
                </div>
                <div className="numeric">
                  <span className="row-label">Qtd.</span>
                  <strong>{quantity(row.d1_quant)}</strong>
                </div>
                <div className="numeric">
                  <span className="row-label">Valor unit.</span>
                  <strong>{money(row.d1_vunit)}</strong>
                </div>
                <div className="numeric">
                  <span className="row-label">Valor total</span>
                  <strong>{money(row.d1_total)}</strong>
                </div>
                <div className="numeric">
                  <span className="row-label">Custo calc.</span>
                  <strong>{cost(row.custo_unitario)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
