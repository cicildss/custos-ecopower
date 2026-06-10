import type { ProductSearchResult } from "../types/api";

type ProductListProps = {
  products: ProductSearchResult[];
  selectedCode?: string;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  query?: string;
  onSelect: (code: string) => void;
};

export function ProductList({ products, selectedCode, loading, error, errorMessage, query = "", onSelect }: ProductListProps) {
  if (query.trim().length < 2) {
    return <div className="result-state">Digite ao menos 2 caracteres para buscar produtos.</div>;
  }

  if (loading) {
    return <div className="result-state">Buscando produtos...</div>;
  }

  if (error) {
    return (
      <div className="result-state error">
        <strong>Busca indisponível</strong>
        <span>{errorMessage ?? "A API não respondeu. Confira se o backend está ativo."}</span>
      </div>
    );
  }

  if (!products.length) {
    return <div className="result-state">Nenhum produto encontrado para "{query}".</div>;
  }

  return (
    <div className="product-results">
      {products.map((product, index) => {
        const selected = product.codigo === selectedCode;
        return (
          <button
            key={`${product.codigo}-${index}`}
            type="button"
            onClick={() => onSelect(product.codigo)}
            className={`product-result ${selected ? "active" : ""}`}
          >
            <span>{product.codigo}</span>
            <strong>{product.descricao}</strong>
          </button>
        );
      })}
    </div>
  );
}
