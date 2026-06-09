import argparse
import json
import sqlite3
from pathlib import Path

from import_csv_seed import PARSERS, read_csv_table


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "local-no-admin" / "consulta_produtos.sqlite"


TABLES = {
    "sb1": "sb1_produtos",
    "sb2": "sb2_saldos",
    "sd1": "sd1_itens_nf",
    "sa1": "sa1_clientes",
    "sa2": "sa2_fornecedores",
}


SCHEMA = """
DROP TABLE IF EXISTS sd1_itens_nf;
DROP TABLE IF EXISTS sb2_saldos;
DROP TABLE IF EXISTS sb1_produtos;
DROP TABLE IF EXISTS sa1_clientes;
DROP TABLE IF EXISTS sa2_fornecedores;

CREATE TABLE sb1_produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  b1_cod TEXT NOT NULL,
  b1_desc TEXT NOT NULL,
  b1_desc_nf TEXT,
  b1_um TEXT,
  b1_tipo TEXT,
  b1_grupo TEXT,
  b1_posipi TEXT,
  b1_local_pad TEXT,
  b1_aliq_icms REAL,
  b1_aliq_ipi REAL,
  b1_preco_venda REAL,
  b1_ult_preco REAL,
  b1_ult_compra TEXT,
  extra TEXT,
  d_e_l_e_t_ TEXT
);

CREATE TABLE sb2_saldos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  b2_filial TEXT,
  b2_cod TEXT NOT NULL,
  b2_local TEXT,
  b2_qatu REAL,
  b2_cm1 REAL,
  b2_descricao TEXT,
  extra TEXT,
  d_e_l_e_t_ TEXT
);

CREATE TABLE sd1_itens_nf (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  d1_filial TEXT,
  d1_item TEXT,
  d1_cod TEXT NOT NULL,
  d1_um TEXT,
  d1_quant REAL,
  d1_local TEXT,
  d1_vunit REAL,
  d1_custo REAL,
  d1_total REAL,
  d1_fornece TEXT,
  d1_loja TEXT,
  d1_doc TEXT,
  d1_serie TEXT,
  d1_emissao TEXT,
  d1_dtdigit TEXT,
  d1_grupo TEXT,
  d1_tipo TEXT,
  extra TEXT,
  d_e_l_e_t_ TEXT
);

CREATE TABLE sa1_clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a1_cod TEXT NOT NULL,
  a1_loja TEXT NOT NULL,
  a1_nome TEXT,
  a1_nreduz TEXT,
  a1_tipo TEXT,
  a1_est TEXT,
  a1_mun TEXT,
  a1_cgc TEXT,
  extra TEXT,
  d_e_l_e_t_ TEXT
);

CREATE TABLE sa2_fornecedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a2_cod TEXT NOT NULL,
  a2_loja TEXT NOT NULL,
  a2_nome TEXT,
  a2_nreduz TEXT,
  a2_est TEXT,
  a2_mun TEXT,
  a2_cgc TEXT,
  extra TEXT,
  d_e_l_e_t_ TEXT
);
"""


INDEXES = """
CREATE INDEX idx_local_sb1_cod ON sb1_produtos (b1_cod);
CREATE INDEX idx_local_sb1_desc ON sb1_produtos (b1_desc);
CREATE INDEX idx_local_sb2_cod ON sb2_saldos (b2_cod);
CREATE INDEX idx_local_sd1_cod ON sd1_itens_nf (d1_cod);
CREATE INDEX idx_local_sa1_cod_loja ON sa1_clientes (a1_cod, a1_loja);
CREATE INDEX idx_local_sa2_cod_loja ON sa2_fornecedores (a2_cod, a2_loja);
"""


def normalize_value(value):
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return value


def insert_batch(cursor, table, rows):
    keys = sorted({key for row in rows for key in row.keys()})
    columns = ", ".join(keys)
    placeholders = ", ".join(["?"] * len(keys))
    values = [[normalize_value(row.get(key)) for key in keys] for row in rows]
    cursor.executemany(f"INSERT INTO {table} ({columns}) VALUES ({placeholders})", values)


def main():
    parser = argparse.ArgumentParser(description="Importa os CSVs exportados do XLSB direto no SQLite local.")
    parser.add_argument("--csv-dir", default=str(ROOT / "work" / "extracted-csv"))
    parser.add_argument("--db", default=str(DEFAULT_DB))
    parser.add_argument("--batch-size", type=int, default=5000)
    args = parser.parse_args()

    csv_dir = Path(args.csv_dir)
    db_path = Path(args.db)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    con = sqlite3.connect(db_path)
    cur = con.cursor()
    cur.executescript(SCHEMA)

    for key in ["sb1", "sb2", "sd1", "sa1", "sa2"]:
        parser_fn = PARSERS[key]
        table = TABLES[key]
        batch = []
        count = 0
        for row in read_csv_table(csv_dir / f"{key}.csv", key):
            parsed = parser_fn(row)
            if not parsed:
                continue
            batch.append(parsed)
            if len(batch) >= args.batch_size:
                insert_batch(cur, table, batch)
                con.commit()
                count += len(batch)
                batch.clear()
                print(f"{key.upper()}: {count} registros importados")
        if batch:
            insert_batch(cur, table, batch)
            con.commit()
            count += len(batch)
        print(f"{key.upper()}: {count} registros importados")

    cur.executescript(INDEXES)
    con.commit()
    con.close()
    print(f"SQLite gerado em: {db_path}")


if __name__ == "__main__":
    main()
