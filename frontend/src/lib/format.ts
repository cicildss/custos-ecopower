export const brNumber = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const brCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function money(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? brCurrency.format(number) : "N/A";
}

export function quantity(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? brNumber.format(number) : "N/A";
}

export function cost(value: number | null | undefined) {
  return value === null || value === undefined ? "N/A" : brCurrency.format(value);
}

export function date(value: unknown) {
  if (!value) return "N/A";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("pt-BR");
}
