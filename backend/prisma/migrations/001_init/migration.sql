CREATE TABLE IF NOT EXISTS sb1_produtos (
  id SERIAL PRIMARY KEY,
  b1_filial VARCHAR(8),
  b1_cod VARCHAR(60) NOT NULL,
  b1_desc TEXT NOT NULL,
  b1_desc_nf TEXT,
  b1_um VARCHAR(12),
  b1_tipo VARCHAR(20),
  b1_grupo VARCHAR(30),
  b1_posipi VARCHAR(30),
  b1_local_pad VARCHAR(20),
  b1_peso NUMERIC(18, 6),
  b1_pesbru NUMERIC(18, 6),
  b1_dtcad DATE,
  b1_aliq_icms NUMERIC(18, 6),
  b1_aliq_ipi NUMERIC(18, 6),
  b1_preco_venda NUMERIC(18, 6),
  b1_ult_preco NUMERIC(18, 6),
  b1_ult_compra DATE,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  d_e_l_e_t_ CHAR(1),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sb2_saldos (
  id SERIAL PRIMARY KEY,
  b2_filial VARCHAR(8),
  b2_cod VARCHAR(60) NOT NULL,
  b2_local VARCHAR(20),
  b2_qatu NUMERIC(18, 6),
  b2_cm1 NUMERIC(18, 6),
  b2_descricao TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  d_e_l_e_t_ CHAR(1)
);

CREATE TABLE IF NOT EXISTS sd1_itens_nf (
  id SERIAL PRIMARY KEY,
  d1_filial VARCHAR(8),
  d1_item VARCHAR(20),
  d1_cod VARCHAR(60) NOT NULL,
  d1_um VARCHAR(12),
  d1_quant NUMERIC(18, 6),
  d1_local VARCHAR(20),
  d1_vunit NUMERIC(18, 6),
  d1_custo NUMERIC(18, 6),
  d1_total NUMERIC(18, 6),
  d1_fornece VARCHAR(30),
  d1_cliente VARCHAR(30),
  d1_loja VARCHAR(10),
  d1_doc VARCHAR(40),
  d1_serie VARCHAR(20),
  d1_emissao DATE,
  d1_dtdigit DATE,
  d1_grupo VARCHAR(30),
  d1_tipo VARCHAR(20),
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  d_e_l_e_t_ CHAR(1)
);

CREATE TABLE IF NOT EXISTS sa1_clientes (
  id SERIAL PRIMARY KEY,
  a1_cod VARCHAR(30) NOT NULL,
  a1_loja VARCHAR(10) NOT NULL,
  a1_nome TEXT,
  a1_nreduz TEXT,
  a1_tipo VARCHAR(30),
  a1_est VARCHAR(2),
  a1_mun TEXT,
  a1_cgc VARCHAR(30),
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  d_e_l_e_t_ CHAR(1)
);

CREATE TABLE IF NOT EXISTS sa2_fornecedores (
  id SERIAL PRIMARY KEY,
  a2_cod VARCHAR(30) NOT NULL,
  a2_loja VARCHAR(10) NOT NULL,
  a2_nome TEXT,
  a2_nreduz TEXT,
  a2_est VARCHAR(2),
  a2_mun TEXT,
  a2_cgc VARCHAR(30),
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  d_e_l_e_t_ CHAR(1)
);

CREATE INDEX IF NOT EXISTS idx_sb1_produtos_b1_cod ON sb1_produtos (b1_cod);
CREATE INDEX IF NOT EXISTS idx_sb1_produtos_b1_desc ON sb1_produtos (b1_desc);
CREATE INDEX IF NOT EXISTS idx_sb2_saldos_b2_cod ON sb2_saldos (b2_cod);
CREATE INDEX IF NOT EXISTS idx_sd1_itens_nf_d1_cod ON sd1_itens_nf (d1_cod);
CREATE INDEX IF NOT EXISTS idx_sd1_itens_nf_d1_fornece_d1_loja ON sd1_itens_nf (d1_fornece, d1_loja);
CREATE INDEX IF NOT EXISTS idx_sa1_clientes_a1_cod_a1_loja ON sa1_clientes (a1_cod, a1_loja);
CREATE INDEX IF NOT EXISTS idx_sa2_fornecedores_a2_cod_a2_loja ON sa2_fornecedores (a2_cod, a2_loja);
