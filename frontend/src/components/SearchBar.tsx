import { useState } from "react";
import { Search } from "lucide-react";
import type { ProductSearchResult } from "../types/api";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: ProductSearchResult[];
  loading?: boolean;
  onSelect: (code: string) => void;
};

export function SearchBar({ value, onChange, suggestions, loading, onSelect }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const showSuggestions = focused && value.trim().length > 0;

  return (
    <div className="relative">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder="Buscar por codigo ou descricao"
          className="h-12 w-full rounded-md border border-line bg-white pl-11 pr-4 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </label>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-md border border-line bg-white shadow-lg">
          {loading && <div className="px-4 py-3 text-sm text-slate-600">Buscando produtos...</div>}

          {!loading && suggestions.length === 0 && <div className="px-4 py-3 text-sm text-slate-600">Nenhum item encontrado.</div>}

          {!loading &&
            suggestions.slice(0, 8).map((product, index) => (
              <button
                key={`${product.codigo}-${index}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(product.codigo);
                  setFocused(false);
                }}
                className="block w-full border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-panel focus:bg-panel focus:outline-none"
              >
                <span className="block text-sm font-semibold text-slate-900">{product.codigo}</span>
                <span className="block truncate text-sm text-slate-600">{product.descricao}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
