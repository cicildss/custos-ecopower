import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";
import { getProduct, searchProducts } from "./lib/api";
import { InvoicesTable } from "./components/InvoicesTable";
import { ProductDetails } from "./components/ProductDetails";
import { ProductList } from "./components/ProductList";
import { SearchBar } from "./components/SearchBar";
import { StockPanel } from "./components/StockPanel";

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [delay, value]);

  return debounced;
}

export function App() {
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState<string>();
  const [filial, setFilial] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const searchQuery = useQuery({
    queryKey: ["products", debouncedSearch],
    queryFn: () => searchProducts(debouncedSearch),
    enabled: debouncedSearch.trim().length > 0,
  });

  const products = searchQuery.data ?? [];

  useEffect(() => {
    if (!products.length) return;
    if (!selectedCode || !products.some((product) => product.codigo === selectedCode)) {
      setSelectedCode(products[0].codigo);
      setPage(1);
    }
  }, [products, selectedCode]);

  const detailQuery = useQuery({
    queryKey: ["product", selectedCode, page, filial],
    queryFn: () => getProduct(selectedCode ?? "", page, filial),
    enabled: Boolean(selectedCode),
  });

  const selectedDescription = useMemo(
    () => products.find((product) => product.codigo === selectedCode)?.descricao,
    [products, selectedCode],
  );

  const selectProduct = (code: string) => {
    setSelectedCode(code);
    setPage(1);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase text-brand">
            <PackageSearch className="h-4 w-4" />
            Consulta ERP
          </div>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">Produtos, Estoque e Entradas</h1>
        </div>
        <div className="w-full max-w-3xl">
          <SearchBar
            value={search}
            onChange={setSearch}
            suggestions={products}
            loading={searchQuery.isFetching}
            onSelect={selectProduct}
          />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-md border border-line bg-white p-4">
            <label className="block text-sm font-medium text-slate-700" htmlFor="filial">
              Filial
            </label>
            <input
              id="filial"
              value={filial}
              onChange={(event) => {
                setFilial(event.target.value);
                setPage(1);
              }}
              placeholder="Consolidar todas"
              className="mt-2 h-10 w-full rounded-md border border-line px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <ProductList
            products={products}
            selectedCode={selectedCode}
            loading={searchQuery.isFetching}
            onSelect={selectProduct}
          />
        </aside>

        <section className="min-w-0 space-y-5">
          {!selectedCode && (
            <div className="rounded-md border border-dashed border-line bg-white p-8 text-center text-slate-600">
              Informe parte do código ou descrição do produto para iniciar a consulta.
            </div>
          )}

          {selectedCode && detailQuery.isLoading && (
            <div className="rounded-md border border-line bg-white p-8 text-center text-slate-600">Carregando detalhes...</div>
          )}

          {detailQuery.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">Não foi possível carregar o produto selecionado.</div>
          )}

          {detailQuery.data && (
            <>
              <div className="rounded-md border border-line bg-white p-4">
                <div className="text-sm font-semibold text-slate-500">{selectedCode}</div>
                <div className="mt-1 text-lg font-semibold">{selectedDescription ?? String(detailQuery.data.sb1.b1_desc ?? "")}</div>
              </div>
              <StockPanel data={detailQuery.data.sb2} />
              <ProductDetails product={detailQuery.data.sb1} />
              <InvoicesTable data={detailQuery.data.sd1} onPageChange={setPage} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
