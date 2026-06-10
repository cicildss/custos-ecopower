import type { ProductDetail, ProductSearchResult } from "../types/api";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${path}`, { signal: controller.signal });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("A API demorou para responder. Confira se o backend está ativo.");
    }
    if (error instanceof TypeError) {
      throw new Error("Não foi possível conectar na API. Verifique se ela está rodando e se o CORS está liberado.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function searchProducts(query: string) {
  return request<ProductSearchResult[]>(`/api/produtos/busca?q=${encodeURIComponent(query)}`);
}

export function getProduct(codigo: string, page: number, filial?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (filial?.trim()) params.set("filial", filial.trim());
  return request<ProductDetail>(`/api/produtos/${encodeURIComponent(codigo)}?${params.toString()}`);
}
