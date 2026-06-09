type ProductDetailsProps = {
  product: Record<string, unknown>;
};

const labels: Record<string, string> = {
  b1_cod: "Código",
  b1_desc: "Descrição",
  b1_desc_nf: "Descrição NF",
  b1_um: "Unidade",
  b1_tipo: "Tipo",
  b1_grupo: "Grupo",
  b1_posipi: "NCM",
  b1_local_pad: "Armazém padrão",
  b1_peso: "Peso líquido",
  b1_pesbru: "Peso bruto",
  b1_dtcad: "Data de cadastro",
  b1_preco_venda: "Preço venda",
  b1_ult_preco: "Último preço",
  b1_ult_compra: "Última compra",
};

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const entries = Object.entries(product).filter(([key]) => !["id", "created_at", "updated_at", "d_e_l_e_t_"].includes(key));

  return (
    <section className="rounded-md border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-base font-semibold">Cadastro do Produto</h2>
      </div>
      <dl className="grid gap-px bg-line text-sm sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key} className="min-w-0 bg-white px-4 py-3">
            <dt className="text-xs font-semibold uppercase text-slate-500">{labels[key] ?? key}</dt>
            <dd className="mt-1 break-words text-slate-900">{display(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
