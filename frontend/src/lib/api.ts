import type { ProductDetail, ProductSearchResult } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function searchProducts(query: string) {
  return request<ProductSearchResult[]>(`/api/produtos/busca?q=${encodeURIComponent(query)}`);
}

export function getProduct(codigo: string, page: number, filial?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (filial?.trim()) params.set("filial", filial.trim());
  return request<ProductDetail>(`/api/produtos/${encodeURIComponent(codigo)}?${params.toString()}`);
}
