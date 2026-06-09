import { cost, money, quantity } from "../lib/format";
import type { ProductDetail } from "../types/api";

type StockPanelProps = {
  data: ProductDetail["sb2"];
};

export function StockPanel({ data }: StockPanelProps) {
  return (
    <section className="rounded-md border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-base font-semibold">Estoque e Valor</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-panel text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Filial</th>
              <th className="px-4 py-3">Armazém</th>
              <th className="px-4 py-3 text-right">Quantidade</th>
              <th className="px-4 py-3 text-right">Custo total</th>
              <th className="px-4 py-3 text-right">Custo unitário</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, index) => (
              <tr key={`${row.b2_filial}-${row.b2_local}-${index}`} className="border-t border-line">
                <td className="px-4 py-3">{row.b2_filial ?? "N/A"}</td>
                <td className="px-4 py-3">{row.b2_local ?? "N/A"}</td>
                <td className="px-4 py-3 text-right">{quantity(row.b2_qatu)}</td>
                <td className="px-4 py-3 text-right">{money(row.b2_cm1)}</td>
                <td className="px-4 py-3 text-right">{cost(row.custo_unitario)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-line bg-panel font-semibold">
            <tr>
              <td className="px-4 py-3" colSpan={2}>
                Total consolidado
              </td>
              <td className="px-4 py-3 text-right">{quantity(data.total.quantidade)}</td>
              <td className="px-4 py-3 text-right">{money(data.total.custo_total)}</td>
              <td className="px-4 py-3 text-right">{cost(data.total.custo_unitario)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
