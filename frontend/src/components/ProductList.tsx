import type { ProductSearchResult } from "../types/api";

type ProductListProps = {
  products: ProductSearchResult[];
  selectedCode?: string;
  loading?: boolean;
  onSelect: (code: string) => void;
};

export function ProductList({ products, selectedCode, loading, onSelect }: ProductListProps) {
  if (loading) {
    return <div className="rounded-md border border-line bg-white p-4 text-sm text-slate-600">Buscando produtos...</div>;
  }

  if (!products.length) {
    return <div className="rounded-md border border-line bg-white p-4 text-sm text-slate-600">Nenhum resultado para exibir.</div>;
  }

  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      {products.map((product) => {
        const selected = product.codigo === selectedCode;
        return (
          <button
            key={product.codigo}
            type="button"
            onClick={() => onSelect(product.codigo)}
            className={`block w-full border-b border-line px-4 py-3 text-left last:border-b-0 ${
              selected ? "bg-brand text-white" : "hover:bg-panel"
            }`}
          >
            <span className="block text-sm font-semibold">{product.codigo}</span>
            <span className={`block truncate text-sm ${selected ? "text-white/85" : "text-slate-600"}`}>{product.descricao}</span>
          </button>
        );
      })}
    </div>
  );
}
