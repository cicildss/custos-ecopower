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
    <section className="rounded-md border border-line bg-panel">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold">Notas fiscais de entrada</h2>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <button
            type="button"
            aria-label="Página anterior"
            title="Página anterior"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="grid h-9 w-9 place-items-center rounded-md border border-line bg-panel-soft disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-28 text-center">
            {page} / {Math.max(totalPages, 1)} ({total})
          </span>
          <button
            type="button"
            aria-label="Próxima página"
            title="Próxima página"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="grid h-9 w-9 place-items-center rounded-md border border-line bg-panel-soft disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-panel-soft text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">NF</th>
              <th className="px-4 py-3">Série</th>
              <th className="px-4 py-3">Emissão</th>
              <th className="px-4 py-3">Entrada</th>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">CNPJ</th>
              <th className="px-4 py-3 text-right">Qtd.</th>
              <th className="px-4 py-3 text-right">Valor unit.</th>
              <th className="px-4 py-3 text-right">Valor total</th>
              <th className="px-4 py-3 text-right">Custo calc.</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr key={`${row.d1_doc}-${row.d1_serie}-${index}`} className="border-t border-line hover:bg-brand/10">
                <td className="px-4 py-3">{row.d1_doc ?? "N/A"}</td>
                <td className="px-4 py-3">{row.d1_serie ?? "N/A"}</td>
                <td className="px-4 py-3">{date(row.d1_emissao)}</td>
                <td className="px-4 py-3">{date(row.d1_dtdigit)}</td>
                <td className="px-4 py-3">
                  <span className="block font-medium">{row.fornecedor.codigo ?? "N/A"} / {row.fornecedor.loja ?? "N/A"}</span>
                  <span className="block max-w-56 truncate text-slate-400">{row.fornecedor.nome ?? "Fornecedor não cadastrado"}</span>
                </td>
                <td className="px-4 py-3">{row.fornecedor.cnpj ?? "N/A"}</td>
                <td className="px-4 py-3 text-right">{quantity(row.d1_quant)}</td>
                <td className="px-4 py-3 text-right">{money(row.d1_vunit)}</td>
                <td className="px-4 py-3 text-right">{money(row.d1_total)}</td>
                <td className="px-4 py-3 text-right">{cost(row.custo_unitario)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
