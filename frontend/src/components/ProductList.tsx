import type { ProductSearchResult } from "../types/api";

type ProductListProps = {
  products: ProductSearchResult[];
  selectedCode?: string;
  loading?: boolean;
  onSelect: (code: string) => void;
};

export function ProductList({ products, selectedCode, loading, onSelect }: ProductListProps) {
  if (loading) {
    return <div className="rounded-md border border-line bg-panel-soft p-4 text-sm text-slate-400">Buscando produtos...</div>;
  }

  if (!products.length) {
    return <div className="rounded-md border border-line bg-panel-soft p-4 text-sm text-slate-400">Nenhum resultado para exibir.</div>;
  }

  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel-soft">
      {products.map((product, index) => {
        const selected = product.codigo === selectedCode;
        return (
          <button
            key={`${product.codigo}-${index}`}
            type="button"
            onClick={() => onSelect(product.codigo)}
            className={`block w-full border-b border-line px-4 py-3 text-left last:border-b-0 transition ${
              selected ? "bg-brand/35 text-white" : "text-white hover:bg-brand/15"
            }`}
          >
            <span className="block text-sm font-semibold">{product.codigo}</span>
            <span className={`block truncate text-sm ${selected ? "text-white/85" : "text-slate-400"}`}>{product.descricao}</span>
          </button>
        );
      })}
    </div>
  );
}
