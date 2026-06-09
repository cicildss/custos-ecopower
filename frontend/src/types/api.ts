export type ProductSearchResult = {
  codigo: string;
  descricao: string;
};

export type StockRow = {
  b2_filial?: string;
  b2_cod: string;
  b2_local?: string;
  b2_qatu?: number | string | null;
  b2_cm1?: number | string | null;
  b2_descricao?: string | null;
  custo_unitario: number | null;
};

export type InvoiceRow = {
  d1_doc?: string | null;
  d1_serie?: string | null;
  d1_emissao?: string | null;
  d1_dtdigit?: string | null;
  d1_fornece?: string | null;
  d1_loja?: string | null;
  d1_quant?: number | string | null;
  d1_vunit?: number | string | null;
  d1_total?: number | string | null;
  fornecedor: {
    codigo?: string | null;
    loja?: string | null;
    nome?: string | null;
    cnpj?: string | null;
  };
  custo_unitario: number | null;
};

export type ProductDetail = {
  sb1: Record<string, unknown>;
  sb2: {
    rows: StockRow[];
    total: {
      quantidade: number;
      custo_total: number;
      custo_unitario: number | null;
    };
  };
  sd1: {
    rows: InvoiceRow[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};
