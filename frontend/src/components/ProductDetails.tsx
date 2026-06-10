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
  b1_preco_venda: "Preço de venda",
  b1_ult_preco: "Último preço",
  b1_ult_compra: "Última compra",
};

const priorityKeys = [
  "b1_cod",
  "b1_desc",
  "b1_desc_nf",
  "b1_um",
  "b1_tipo",
  "b1_grupo",
  "b1_posipi",
  "b1_local_pad",
  "b1_preco_venda",
  "b1_ult_preco",
  "b1_ult_compra",
];

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const excluded = new Set(["id", "created_at", "updated_at", "d_e_l_e_t_"]);
  const entries = Object.entries(product).filter(([key]) => !excluded.has(key));
  const orderedEntries = [
    ...priorityKeys.filter((key) => key in product).map((key) => [key, product[key]] as [string, unknown]),
    ...entries.filter(([key]) => !priorityKeys.includes(key)),
  ];

  return (
    <section className="data-panel">
      <div className="data-panel-header">
        <div>
          <h2>Cadastro do produto</h2>
          <p>Campos principais do SB1, priorizados para leitura operacional.</p>
        </div>
      </div>

      <div className="details-grid">
        {orderedEntries.map(([key, value]) => (
          <article key={key} className="detail-card">
            <span className="row-label">{labels[key] ?? key}</span>
            <strong>{display(value)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
