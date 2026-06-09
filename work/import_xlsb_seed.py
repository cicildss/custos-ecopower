import argparse
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "pydeps"))

try:
    from pyxlsb import open_workbook
except ImportError as error:
    raise SystemExit(
        "Dependencia ausente: pyxlsb. Rode: py -m pip install pyxlsb -t work\\pydeps"
    ) from error


HEADER_ROWS = {
    "sa1": 3,
    "sa2": 3,
    "sb1": 3,
    "sb2": 3,
    "sd1": 3,
}


def value_of(cell):
    value = cell.v
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


def to_text(value):
    if value in (None, "/  /"):
        return None
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def to_number(value):
    if value in (None, "/  /"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def to_date(value):
    if value in (None, "/  /"):
        return None
    if isinstance(value, (int, float)):
        return (datetime(1899, 12, 30) + timedelta(days=float(value))).date().isoformat()
    text = to_text(value)
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            pass
    return None


def make_extra(row, used):
    return {key: value for key, value in row.items() if key not in used and value not in (None, "")}


def read_table(book, sheet_name):
    header_row = HEADER_ROWS[sheet_name.lower()]
    with book.get_sheet(sheet_name) as sheet:
        headers = None
        for idx, row in enumerate(sheet.rows(), start=1):
            values = [value_of(cell) for cell in row]
            if idx == header_row:
                last = max(i for i, value in enumerate(values) if value is not None)
                headers = [str(value or f"col_{i + 1}") for i, value in enumerate(values[: last + 1])]
                continue
            if idx <= header_row or not headers:
                continue

            row_values = values[: len(headers)] + [None] * max(0, len(headers) - len(values))
            if any(value is not None for value in row_values):
                yield dict(zip(headers, row_values))


def parse_sb1(row):
    used = {
        "Codigo",
        "Descricao",
        "Descricao NF",
        "Tipo",
        "Unidade",
        "Armazem Pad.",
        "Grupo",
        "Pos.IPI/NCM",
        "Aliq. ICMS",
        "Aliq. IPI",
        "Preco Venda",
        "Ult. Preco",
        "Ult. Compra",
    }
    code = to_text(row.get("Codigo"))
    desc = to_text(row.get("Descricao"))
    if not code or not desc:
        return None
    return {
        "b1_cod": code,
        "b1_desc": desc,
        "b1_desc_nf": to_text(row.get("Descricao NF")),
        "b1_tipo": to_text(row.get("Tipo")),
        "b1_um": to_text(row.get("Unidade")),
        "b1_local_pad": to_text(row.get("Armazem Pad.")),
        "b1_grupo": to_text(row.get("Grupo")),
        "b1_posipi": to_text(row.get("Pos.IPI/NCM")),
        "b1_aliq_icms": to_number(row.get("Aliq. ICMS")),
        "b1_aliq_ipi": to_number(row.get("Aliq. IPI")),
        "b1_preco_venda": to_number(row.get("Preco Venda")),
        "b1_ult_preco": to_number(row.get("Ult. Preco")),
        "b1_ult_compra": to_date(row.get("Ult. Compra")),
        "extra": make_extra(row, used),
    }


def parse_sb2(row):
    used = {"Filial", "Produto", "Armazem", "Saldo Atual", "Vlr.Final", "Descrição"}
    code = to_text(row.get("Produto"))
    if not code:
        return None
    return {
        "b2_filial": to_text(row.get("Filial")),
        "b2_cod": code,
        "b2_local": to_text(row.get("Armazem")),
        "b2_qatu": to_number(row.get("Saldo Atual")) or 0,
        "b2_cm1": to_number(row.get("Vlr.Final")) or 0,
        "b2_descricao": to_text(row.get("Descrição")),
        "extra": make_extra(row, used),
    }


def parse_sd1(row):
    used = {
        "Filial",
        "Item NF",
        "Produto",
        "Unidade",
        "Quantidade",
        "Armazem",
        "Vlr.Unitario",
        "Custo Moeda1",
        "Vlr.Total",
        "Forn/Cliente",
        "Loja",
        "Documento",
        "DT Emissao",
        "DT Digitacao",
        "Serie",
        "Grupo",
        "Tipo Produto",
    }
    code = to_text(row.get("Produto"))
    if not code:
        return None
    return {
        "d1_filial": to_text(row.get("Filial")),
        "d1_item": to_text(row.get("Item NF")),
        "d1_cod": code,
        "d1_um": to_text(row.get("Unidade")),
        "d1_quant": to_number(row.get("Quantidade")) or 0,
        "d1_local": to_text(row.get("Armazem")),
        "d1_vunit": to_number(row.get("Vlr.Unitario")) or 0,
        "d1_custo": to_number(row.get("Custo Moeda1")) or 0,
        "d1_total": to_number(row.get("Vlr.Total")) or 0,
        "d1_fornece": to_text(row.get("Forn/Cliente")),
        "d1_loja": to_text(row.get("Loja")),
        "d1_doc": to_text(row.get("Documento")),
        "d1_emissao": to_date(row.get("DT Emissao")),
        "d1_dtdigit": to_date(row.get("DT Digitacao")),
        "d1_serie": to_text(row.get("Serie")),
        "d1_grupo": to_text(row.get("Grupo")),
        "d1_tipo": to_text(row.get("Tipo Produto")),
        "extra": make_extra(row, used),
    }


def parse_sa1(row):
    used = {"Codigo", "Loja", "Nome", "N Fantasia", "Tipo", "Estado", "Municipio"}
    code = to_text(row.get("Codigo"))
    store = to_text(row.get("Loja"))
    if not code or not store:
        return None
    return {
        "a1_cod": code,
        "a1_loja": store,
        "a1_nome": to_text(row.get("Nome")),
        "a1_nreduz": to_text(row.get("N Fantasia")),
        "a1_tipo": to_text(row.get("Tipo")),
        "a1_est": to_text(row.get("Estado")),
        "a1_mun": to_text(row.get("Municipio")),
        "extra": make_extra(row, used),
    }


def parse_sa2(row):
    used = {"Codigo", "Loja", "Razao Social", "N Fantasia", "Estado", "Municipio", "CNPJ/CPF"}
    code = to_text(row.get("Codigo"))
    store = to_text(row.get("Loja"))
    if not code or not store:
        return None
    return {
        "a2_cod": code,
        "a2_loja": store,
        "a2_nome": to_text(row.get("Razao Social")),
        "a2_nreduz": to_text(row.get("N Fantasia")),
        "a2_est": to_text(row.get("Estado")),
        "a2_mun": to_text(row.get("Municipio")),
        "a2_cgc": to_text(row.get("CNPJ/CPF")),
        "extra": make_extra(row, used),
    }


PARSERS = {
    "sa1": parse_sa1,
    "sa2": parse_sa2,
    "sb1": parse_sb1,
    "sb2": parse_sb2,
    "sd1": parse_sd1,
}


def main():
    parser = argparse.ArgumentParser(description="Gera o seed JSON completo a partir do XLSB do Protheus.")
    parser.add_argument("--source", required=True, help="Caminho do arquivo scavjpv0.xlsb")
    parser.add_argument("--output", default="backend/prisma/seed-data/sample.json", help="Arquivo JSON de saida")
    args = parser.parse_args()

    source = Path(args.source)
    output = Path(args.output)
    if not source.exists():
        raise SystemExit(f"Arquivo nao encontrado: {source}")

    data = {key: [] for key in ["sb1", "sb2", "sd1", "sa1", "sa2"]}
    with open_workbook(str(source)) as book:
        available = {name.lower(): name for name in book.sheets}
        for key in ["sb1", "sb2", "sd1", "sa1", "sa2"]:
            sheet_name = available.get(key)
            if not sheet_name:
                print(f"Aba ausente: {key}", file=sys.stderr)
                continue
            parser_fn = PARSERS[key]
            for row in read_table(book, sheet_name):
                parsed = parser_fn(row)
                if parsed:
                    data[key].append(parsed)
            print(f"{key.upper()}: {len(data[key])} registros")

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Seed gerado em: {output}")


if __name__ == "__main__":
    main()
