from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
import json
import os
import sqlite3
import webbrowser

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "local-no-admin" / "consulta_produtos.sqlite"
SEED_PATH = ROOT / "backend" / "prisma" / "seed-data" / "sample.json"
PUBLIC_DIR = ROOT / "local-no-admin" / "public"
HOST = "127.0.0.1"
PORT = 5173


def connect():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    if DB_PATH.exists() and os.environ.get("FORCE_SEED") != "1":
        return

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    seed = json.loads(SEED_PATH.read_text(encoding="utf-8-sig"))
    con = connect()
    cur = con.cursor()
    cur.executescript(
        """
        DROP TABLE IF EXISTS sd1_itens_nf;
        DROP TABLE IF EXISTS sb2_saldos;
        DROP TABLE IF EXISTS sb1_produtos;
        DROP TABLE IF EXISTS sa1_clientes;
        DROP TABLE IF EXISTS sa2_fornecedores;

        CREATE TABLE IF NOT EXISTS sb1_produtos (
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
        CREATE TABLE IF NOT EXISTS sb2_saldos (
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
        CREATE TABLE IF NOT EXISTS sd1_itens_nf (
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
        CREATE TABLE IF NOT EXISTS sa1_clientes (
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
        CREATE TABLE IF NOT EXISTS sa2_fornecedores (
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
        CREATE INDEX IF NOT EXISTS idx_local_sb1_cod ON sb1_produtos (b1_cod);
        CREATE INDEX IF NOT EXISTS idx_local_sb1_desc ON sb1_produtos (b1_desc);
        CREATE INDEX IF NOT EXISTS idx_local_sb2_cod ON sb2_saldos (b2_cod);
        CREATE INDEX IF NOT EXISTS idx_local_sd1_cod ON sd1_itens_nf (d1_cod);
        CREATE INDEX IF NOT EXISTS idx_local_sa2_cod_loja ON sa2_fornecedores (a2_cod, a2_loja);
        DELETE FROM sd1_itens_nf;
        DELETE FROM sb2_saldos;
        DELETE FROM sb1_produtos;
        DELETE FROM sa1_clientes;
        DELETE FROM sa2_fornecedores;
        """
    )
    insert_many(cur, "sb1_produtos", seed["sb1"])
    insert_many(cur, "sb2_saldos", seed["sb2"])
    insert_many(cur, "sd1_itens_nf", seed["sd1"])
    insert_many(cur, "sa1_clientes", seed.get("sa1", []))
    insert_many(cur, "sa2_fornecedores", seed["sa2"])
    con.commit()
    con.close()


def insert_many(cur, table, rows):
    if not rows:
        return
    keys = sorted({key for row in rows for key in row.keys()})
    columns = ", ".join(keys)
    placeholders = ", ".join(["?"] * len(keys))
    values = [[json.dumps(row.get(key), ensure_ascii=False) if isinstance(row.get(key), (dict, list)) else row.get(key) for key in keys] for row in rows]
    cur.executemany(f"INSERT INTO {table} ({columns}) VALUES ({placeholders})", values)


def rows_to_dict(rows):
    return [dict(row) for row in rows]


def unit_cost(total, quantity):
    try:
        q = float(quantity or 0)
        if q == 0:
            return None
        return float(total or 0) / q
    except (TypeError, ValueError):
        return None


def search_products(term):
    con = connect()
    rows = con.execute(
        """
        SELECT b1_cod AS codigo, b1_desc AS descricao
        FROM sb1_produtos
        WHERE COALESCE(d_e_l_e_t_, '') <> '*'
          AND (TRIM(b1_cod) LIKE ? COLLATE NOCASE OR TRIM(b1_desc) LIKE ? COLLATE NOCASE)
        ORDER BY b1_cod
        LIMIT 50
        """,
        (f"%{term}%", f"%{term}%"),
    ).fetchall()
    con.close()
    return rows_to_dict(rows)


def product_detail(code, page, page_size, filial):
    con = connect()
    product = con.execute(
        """
        SELECT *
        FROM sb1_produtos
        WHERE COALESCE(d_e_l_e_t_, '') <> '*'
          AND TRIM(b1_cod) = ?
        LIMIT 1
        """,
        (code,),
    ).fetchone()
    if not product:
        con.close()
        return None

    filial_sql = " AND b2_filial = ?" if filial else ""
    stock_params = [code] + ([filial] if filial else [])
    stock_rows = rows_to_dict(
        con.execute(
            f"""
            SELECT b2_filial, b2_cod, b2_local, b2_qatu, b2_cm1, b2_descricao
            FROM sb2_saldos
            WHERE COALESCE(d_e_l_e_t_, '') <> '*'
              AND TRIM(b2_cod) = ?
              {filial_sql}
            ORDER BY b2_filial, b2_local
            """,
            stock_params,
        ).fetchall()
    )
    for row in stock_rows:
        row["custo_unitario"] = unit_cost(row.get("b2_cm1"), row.get("b2_qatu"))

    sd1_filial_sql = " AND d1.d1_filial = ?" if filial else ""
    count_params = [code] + ([filial] if filial else [])
    total = con.execute(
        f"""
        SELECT COUNT(*) AS total
        FROM sd1_itens_nf d1
        WHERE COALESCE(d1.d_e_l_e_t_, '') <> '*'
          AND TRIM(d1.d1_cod) = ?
          {sd1_filial_sql}
        """,
        count_params,
    ).fetchone()["total"]

    offset = (page - 1) * page_size
    invoice_params = [code] + ([filial] if filial else []) + [page_size, offset]
    invoice_rows = rows_to_dict(
        con.execute(
            f"""
            SELECT
              d1.d1_doc, d1.d1_serie, d1.d1_emissao, d1.d1_dtdigit,
              d1.d1_fornece, d1.d1_loja, a2.a2_nome, a2.a2_cgc,
              d1.d1_quant, d1.d1_vunit, d1.d1_total
            FROM sd1_itens_nf d1
            LEFT JOIN sa2_fornecedores a2
              ON TRIM(d1.d1_fornece) = TRIM(a2.a2_cod)
             AND TRIM(d1.d1_loja) = TRIM(a2.a2_loja)
             AND COALESCE(a2.d_e_l_e_t_, '') <> '*'
            WHERE COALESCE(d1.d_e_l_e_t_, '') <> '*'
              AND TRIM(d1.d1_cod) = ?
              {sd1_filial_sql}
            ORDER BY d1.d1_dtdigit DESC, d1.id DESC
            LIMIT ? OFFSET ?
            """,
            invoice_params,
        ).fetchall()
    )
    con.close()

    for row in invoice_rows:
        row["fornecedor"] = {
            "codigo": row.get("d1_fornece"),
            "loja": row.get("d1_loja"),
            "nome": row.get("a2_nome"),
            "cnpj": row.get("a2_cgc"),
        }
        row["custo_unitario"] = unit_cost(row.get("d1_total"), row.get("d1_quant"))

    total_qtd = sum(float(row.get("b2_qatu") or 0) for row in stock_rows)
    total_cost = sum(float(row.get("b2_cm1") or 0) for row in stock_rows)

    return {
        "sb1": dict(product),
        "sb2": {
            "rows": stock_rows,
            "total": {
                "quantidade": total_qtd,
                "custo_total": total_cost,
                "custo_unitario": unit_cost(total_cost, total_qtd),
            },
        },
        "sd1": {
            "rows": invoice_rows,
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "total": total,
                "totalPages": (total + page_size - 1) // page_size,
            },
        },
    }


class Handler(BaseHTTPRequestHandler):
    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)

        if parsed.path == "/api/produtos/busca":
            term = (query.get("q") or [""])[0].strip()
            self.send_json(search_products(term) if term else [])
            return

        if parsed.path.startswith("/api/produtos/"):
            code = unquote(parsed.path.removeprefix("/api/produtos/")).strip()
            page = int((query.get("page") or ["1"])[0])
            page_size = int((query.get("pageSize") or ["20"])[0])
            filial = ((query.get("filial") or [""])[0]).strip() or None
            detail = product_detail(code, page, page_size, filial)
            if not detail:
                self.send_json({"message": "Produto nao encontrado"}, 404)
                return
            self.send_json(detail)
            return

        file_path = PUBLIC_DIR / ("index.html" if parsed.path in ("/", "") else parsed.path.lstrip("/"))
        if not file_path.exists() or not file_path.is_file():
            self.send_response(404)
            self.end_headers()
            return
        content = file_path.read_bytes()
        content_type = "text/html; charset=utf-8" if file_path.suffix == ".html" else "text/plain; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    init_db()
    url = f"http://{HOST}:{PORT}/"
    print(f"Servidor local sem admin: {url}")
    print("Pressione Ctrl+C para parar.")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
